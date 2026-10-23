import { asc, eq, max, sql, sum } from 'drizzle-orm';
import { monthHistory, reading, syncStatus, tariff, type Fuel } from './db/schema.ts';
import { monthlyUse } from '../usage.ts';
import type { DB } from './db/index.ts';

/** A fuel's use and cost month by month, summed in SQL (a year of readings is ~17k rows). */
export async function fuelMonths(db: DB, fuel: Fuel, thisMonth: string) {
	const month = sql<string>`substr(${reading.day}, 1, 7)`;
	const [meter, history, prices] = await Promise.all([
		db
			.select({
				month,
				wh: sum(reading.wh).mapWith(Number),
				// Bright stores missing readings as 0, so a day counts when it has a real one.
				days: sql<number>`count(distinct case when ${reading.wh} > 0 then ${reading.day} end)`.mapWith(
					Number
				)
			})
			.from(reading)
			.where(eq(reading.fuel, fuel))
			.groupBy(month),
		db
			.select({ month: monthHistory.month, kwh: monthHistory.kwh })
			.from(monthHistory)
			.where(eq(monthHistory.fuel, fuel)),
		db.select().from(tariff).where(eq(tariff.fuel, fuel)).orderBy(asc(tariff.from))
	]);
	return monthlyUse(meter, history, thisMonth, prices);
}

/** The newest day with readings, and how the last sync went. */
export async function syncInfo(db: DB, fuel: Fuel) {
	const [[latest], [status]] = await Promise.all([
		db
			.select({ day: max(reading.day) })
			.from(reading)
			.where(eq(reading.fuel, fuel)),
		db.select().from(syncStatus)
	]);
	return { latestDay: latest?.day ?? null, status: status ?? null };
}
