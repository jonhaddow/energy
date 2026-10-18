import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { testDb } from './test-db.ts';
import { monthHistory, weatherDay } from './db/schema.ts';
import { degreeDays, saveLocation, syncWeather } from './weather.ts';
import { addDays } from '../dates.ts';
import type { DB } from './db/index.ts';

/** Open-Meteo: 10°C every day asked for; the archive stops a week before today. */
function fakeOpenMeteo(today: string) {
	const urls: string[] = [];
	vi.stubGlobal('fetch', async (url: string) => {
		urls.push(url);
		const q = new URL(url).searchParams;
		const time: string[] = [];
		for (let d = q.get('start_date')!; d <= q.get('end_date')!; d = addDays(d, 1)) time.push(d);
		const archived = (d: string) => !url.includes('archive') || d < addDays(today, -7);
		return Response.json({
			daily: { time, temperature_2m_mean: time.map((d) => (archived(d) ? 10 : null)) }
		});
	});
	return urls;
}

let db: DB;
beforeEach(async () => {
	db = await testDb();
	await db.insert(monthHistory).values({ fuel: 'gas', month: '2026-08', kwh: 300 });
	await saveLocation(db, { name: 'Swansea, Wales', latitude: 51.6, longitude: -3.9 });
});
afterEach(() => {
	vi.unstubAllGlobals();
});

describe('syncWeather', () => {
	it('fills in from the first gas month to yesterday, then only once a day', async () => {
		const urls = fakeOpenMeteo('2026-10-18');
		await syncWeather(db, '2026-10-18');
		const days = await db.select().from(weatherDay);
		// 1 Aug to 17 Oct, with no gaps where the archive stops.
		expect(days.length).toBe(31 + 30 + 17);
		expect(days.at(-1)).toEqual({ day: '2026-10-17', meanC: 10 });
		expect(urls.length).toBe(2);
		await syncWeather(db, '2026-10-18');
		expect(urls.length).toBe(2);
		await syncWeather(db, '2026-10-19');
		expect(urls).toHaveLength(3);
		expect(urls[2]).toContain('api.open-meteo.com/v1/forecast');
	});

	it('starts again for a new location', async () => {
		fakeOpenMeteo('2026-10-18');
		await syncWeather(db, '2026-10-18');
		await saveLocation(db, { name: 'Leeds, England', latitude: 53.8, longitude: -1.5 });
		expect(await db.select().from(weatherDay)).toEqual([]);
	});
});

describe('degreeDays', () => {
	it('adds up how far each day is below 15.5°C', async () => {
		await db.insert(weatherDay).values([
			{ day: '2026-01-01', meanC: 5.5 },
			{ day: '2026-01-02', meanC: 18 }
		]);
		expect(await degreeDays(db)).toEqual([{ month: '2026-01', degreeDays: 10, days: 2 }]);
	});
});
