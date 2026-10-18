// Daily temperatures from Open-Meteo (free, no key), so gas use can allow for
// the weather. Docs: https://open-meteo.com/en/docs
import { eq, max, min, sql } from 'drizzle-orm';
import { location, monthHistory, weatherDay } from './db/schema.ts';
import { addDays } from '../dates.ts';
import type { DB } from './db/index.ts';

export type Location = typeof location.$inferSelect;

/** Heating degree days are below this daily mean (°C), the usual UK base. */
const BASE_C = 15.5;
/** The forecast API has the last few days (the archive lags), up to this many back. */
const RECENT_DAYS = 10;

async function get<T>(url: string): Promise<T> {
	const res = await fetch(url);
	if (!res.ok) throw new Error(`Open-Meteo ${new URL(url).pathname} failed (${res.status})`);
	return res.json() as Promise<T>;
}

/** A UK town, as Open-Meteo knows it; null if it doesn't. */
export async function findPlace(name: string): Promise<Omit<Location, 'id'> | null> {
	const q = new URLSearchParams({ name, count: '1', countryCode: 'GB' });
	const body = await get<{
		results?: { name: string; admin1?: string; latitude: number; longitude: number }[];
	}>(`https://geocoding-api.open-meteo.com/v1/search?${q}`);
	const r = body.results?.[0];
	if (!r) return null;
	return {
		name: r.admin1 ? `${r.name}, ${r.admin1}` : r.name,
		latitude: r.latitude,
		longitude: r.longitude
	};
}

export const getLocation = async (db: DB) =>
	(await db.select().from(location).where(eq(location.id, 1)))[0] ?? null;

/** A new location; the old one's temperatures go, and the next sync fetches the new one's. */
export const saveLocation = (db: DB, place: Omit<Location, 'id'>) =>
	db.batch([
		db.delete(weatherDay),
		db
			.insert(location)
			.values({ id: 1, ...place })
			.onConflictDoUpdate({ target: location.id, set: place })
	]);

/** Daily means from `from` to `to` (YYYY-MM-DD): the archive for history, else the recent forecast. */
async function dailyMeans(loc: Location, from: string, to: string, archive: boolean) {
	const q = new URLSearchParams({
		latitude: String(loc.latitude),
		longitude: String(loc.longitude),
		daily: 'temperature_2m_mean',
		timezone: 'Europe/London',
		start_date: from,
		end_date: to
	});
	const host = archive ? 'archive-api.open-meteo.com/v1/archive' : 'api.open-meteo.com/v1/forecast';
	const body = await get<{ daily?: { time: string[]; temperature_2m_mean: (number | null)[] } }>(
		`https://${host}?${q}`
	);
	const d = body.daily;
	if (!d) return [];
	return d.time.flatMap((day, i) => {
		const meanC = d.temperature_2m_mean[i];
		return meanC === null ? [] : { day, meanC };
	});
}

/**
 * Fills in temperatures up to yesterday: from the first gas month the first
 * time (the archive, one request), then the last few days from the forecast
 * API, which has them before the archive does. Once a day is enough.
 */
export async function syncWeather(db: DB, today: string) {
	const loc = await getLocation(db);
	if (!loc) return;
	const yesterday = addDays(today, -1);
	const [{ latest }] = await db.select({ latest: max(weatherDay.day) }).from(weatherDay);
	if (latest && latest >= yesterday) return;

	const from = latest ? addDays(latest, 1) : await firstGasDay(db);
	if (!from) return;
	const recent = addDays(today, -RECENT_DAYS);
	const days = [
		...(from < recent ? await dailyMeans(loc, from, yesterday, true) : []),
		...(await dailyMeans(loc, from < recent ? recent : from, yesterday, false))
	];

	// D1 takes at most 100 bound values per query: 2 columns, so 50 rows.
	const inserts = [];
	for (let i = 0; i < days.length; i += 50)
		inserts.push(
			db
				.insert(weatherDay)
				.values(days.slice(i, i + 50))
				.onConflictDoUpdate({ target: weatherDay.day, set: { meanC: sql`excluded.mean_c` } })
		);
	if (inserts.length) await db.batch(inserts as [(typeof inserts)[0], ...typeof inserts]);
}

/** The first day of the gas history (the sheet's, which starts before the meter's). */
async function firstGasDay(db: DB) {
	const [{ month }] = await db
		.select({ month: min(monthHistory.month) })
		.from(monthHistory)
		.where(eq(monthHistory.fuel, 'gas'));
	return month && `${month}-01`;
}

/** Heating degree days a month, for months with a temperature every day. */
export async function degreeDays(db: DB) {
	const month = sql<string>`substr(${weatherDay.day}, 1, 7)`;
	return db
		.select({
			month,
			degreeDays: sql<number>`sum(max(0, ${BASE_C} - ${weatherDay.meanC}))`,
			days: sql<number>`count(*)`
		})
		.from(weatherDay)
		.groupBy(month);
}
