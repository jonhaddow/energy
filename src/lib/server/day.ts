import { and, between, eq, gt, max, min, sum } from 'drizzle-orm';
import { reading, type Fuel } from './db/schema.ts';
import type { DB } from './db/index.ts';

/** Each fuel's first and last half hours with a real reading (unix seconds). */
export async function readingRange(db: DB) {
	const rows = await db
		.select({ fuel: reading.fuel, first: min(reading.start), last: max(reading.start) })
		.from(reading)
		.where(gt(reading.wh, 0))
		.groupBy(reading.fuel);
	return new Map(rows.map((r) => [r.fuel, { first: r.first!, last: r.last! }]));
}

/** A fuel's use day by day from `from` to `to` (YYYY-MM-DD), in watt hours. */
export const dayTotals = (db: DB, fuel: Fuel, from: string, to: string) =>
	db
		.select({ day: reading.day, wh: sum(reading.wh).mapWith(Number) })
		.from(reading)
		.where(and(eq(reading.fuel, fuel), between(reading.day, from, to)))
		.groupBy(reading.day);

/** A fuel's half hours from `from` to `to` (YYYY-MM-DD, UK days). */
export const halfHours = (db: DB, fuel: Fuel, from: string, to: string) =>
	db
		.select({ start: reading.start, day: reading.day, wh: reading.wh })
		.from(reading)
		.where(and(eq(reading.fuel, fuel), between(reading.day, from, to)));
