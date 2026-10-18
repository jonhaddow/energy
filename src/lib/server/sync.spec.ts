import { beforeEach, describe, expect, it } from 'vitest';
import { testDb } from './test-db.ts';
import { backfill, reading, syncStatus } from './db/schema.ts';
import { sync } from './sync.ts';
import type { Glow } from './glow.ts';
import type { DB } from './db/index.ts';

const DAY = 86_400;
const now = Date.UTC(2026, 9, 17, 12) / 1000;
/** The meter has readings from 20 days ago: 0.5 kWh every half hour. */
const meterStart = now - 20 * DAY;

function fakeGlow(start = meterStart): Glow & { calls: number } {
	const g = {
		calls: 0,
		resources: async () => ({ electricity: 'elec' }),
		catchup: async () => {},
		halfHours: async (_id: string, from: number, to: number) => {
			g.calls++;
			const points: [number, number][] = [];
			for (let t = Math.ceil(from / 1800) * 1800; t <= to; t += 1800)
				points.push([t, t >= start && t <= now ? 0.5 : 0]);
			return points;
		}
	};
	return g as unknown as Glow & { calls: number };
}

let db: DB;
beforeEach(async () => {
	db = await testDb();
});

describe('sync', () => {
	it('pulls recent readings, then the history, in UK days', async () => {
		const glow = fakeGlow();
		expect((await sync(db, async () => glow, now)).error).toBeNull();
		const rows = await db.select().from(reading);
		const real = rows.filter((r) => r.wh > 0);
		expect(real.length).toBe(20 * 48 + 1);
		expect(real.every((r) => r.wh === 500 && r.fuel === 'electricity')).toBe(true);
		// 23:30 UTC on a BST day is the next day in the UK.
		const lateEvening = rows.find((r) => r.start === Date.UTC(2026, 9, 10, 23, 30) / 1000);
		expect(lateEvening?.day).toBe('2026-10-11');
		// Backfill found the start of the meter's history.
		expect(await db.select().from(backfill)).toHaveLength(1);
	});

	it('stops backfilling once done, and only fetches new readings', async () => {
		await sync(db, async () => fakeGlow(), now);
		const glow = fakeGlow();
		await sync(db, async () => glow, now + 3600);
		expect(glow.calls).toBe(1);
	});

	it("doesn't finish the backfill before Bright has any data", async () => {
		await sync(db, async () => fakeGlow(Infinity), now);
		expect(await db.select().from(backfill)).toHaveLength(0);
		await sync(db, async () => fakeGlow(), now + 3600);
		expect((await db.select().from(reading)).filter((r) => r.wh > 0)).toHaveLength(20 * 48 + 1);
		expect(await db.select().from(backfill)).toHaveLength(1);
	});

	it('records a failure', async () => {
		const result = await sync(
			db,
			async () => {
				throw new Error('Bright sign-in failed (401)');
			},
			now
		);
		expect(result.error).toBe('Bright sign-in failed (401)');
		const [status] = await db.select().from(syncStatus);
		expect(status.lastError).toBe('Bright sign-in failed (401)');
	});
});
