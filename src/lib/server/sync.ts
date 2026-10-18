import { and, eq, gt, max, min, sql } from 'drizzle-orm';
import { dayOf } from '../dates.ts';
import { backfill, reading, syncStatus, type Fuel } from './db/schema.ts';
import { WINDOW_DAYS, type Glow } from './glow.ts';
import type { DB } from './db/index.ts';

const DAY = 86_400;
const WINDOW = WINDOW_DAYS * DAY;
/** Readings can arrive a day or two late, so the last two days are fetched again. */
const REFETCH = 2 * DAY;
/** History windows per fuel per run: kept small for Workers' CPU and subrequest limits. */
const BACKFILL_WINDOWS = 2;
/** No reading this old exists (smart meters keep about 13 months). */
const OLDEST = 3 * 366 * DAY;

/** Saves readings, replacing any already stored for those half hours. */
export async function saveReadings(db: DB, fuel: Fuel, points: [number, number][], now: number) {
	const rows = points
		.filter(([start, kwh]) => start <= now && Number.isFinite(kwh))
		.map(([start, kwh]) => ({ fuel, start, day: dayOf(start), wh: Math.round(kwh * 1000) }));
	// D1 takes at most 100 bound values per query: 4 columns, so 25 rows.
	const inserts = [];
	for (let i = 0; i < rows.length; i += 25)
		inserts.push(
			db
				.insert(reading)
				.values(rows.slice(i, i + 25))
				.onConflictDoUpdate({
					target: [reading.fuel, reading.start],
					set: { wh: sql`excluded.wh` }
				})
		);
	if (inserts.length) await db.batch(inserts as [(typeof inserts)[0], ...typeof inserts]);
	return rows;
}

/**
 * One fuel: new readings since the last real one, then, until the meter's
 * history is all in, a couple of windows further back.
 */
async function syncFuel(db: DB, glow: Glow, fuel: Fuel, resourceId: string, now: number) {
	const real = and(eq(reading.fuel, fuel), gt(reading.wh, 0));
	const [{ last }] = await db.select({ last: max(reading.start) }).from(reading).where(real);
	let added = 0;

	// Forward: from the last real reading (or 30 days back, the first time) to now.
	for (let from = (last ?? now - 30 * DAY) - REFETCH; from < now; from += WINDOW)
		added += (
			await saveReadings(db, fuel, await glow.halfHours(resourceId, from, from + WINDOW), now)
		).length;

	const [done] = await db.select().from(backfill).where(eq(backfill.fuel, fuel));
	if (done) return added;
	// Back from the first real reading. None yet (Bright hasn't the meter's
	// data from the DCC yet): an empty window wouldn't mean the history's start.
	const [{ first }] = await db.select({ first: min(reading.start) }).from(reading).where(real);
	if (first === null) return added;
	let to = first;
	for (let i = 0; i < BACKFILL_WINDOWS; i++) {
		const points = to < now - OLDEST ? [] : await glow.halfHours(resourceId, to - WINDOW, to);
		// Nothing in a whole window: that's the start of the meter's history.
		if (!points.some(([, kwh]) => kwh > 0)) {
			await db.insert(backfill).values({ fuel, doneAt: new Date(now * 1000).toISOString() });
			break;
		}
		added += (await saveReadings(db, fuel, points, now)).length;
		to -= WINDOW;
	}
	return added;
}

/** The hourly sync. Records how it went for the app to show. */
export async function sync(db: DB, glow: () => Promise<Glow>, now = Math.floor(Date.now() / 1000)) {
	let error: string | null = null;
	const added: Partial<Record<Fuel, number>> = {};
	try {
		const g = await glow();
		const ids = await g.resources();
		await Promise.all(Object.values(ids).map((id) => g.catchup(id)));
		for (const fuel of ['electricity', 'gas'] as const) {
			const id = ids[fuel];
			if (id) added[fuel] = await syncFuel(db, g, fuel, id, now);
		}
	} catch (e) {
		error = e instanceof Error ? e.message : String(e);
	}
	const status = { lastRunAt: new Date(now * 1000).toISOString(), lastError: error };
	await db
		.insert(syncStatus)
		.values({ id: 1, ...status })
		.onConflictDoUpdate({ target: syncStatus.id, set: status });
	return { added, error };
}
