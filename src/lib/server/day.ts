import { and, between, eq, gt, max, min, sum } from 'drizzle-orm';
import { reading, type Fuel } from './db/schema.ts';
import type { DB } from './db/index.ts';
import { addDays, dayOf, ukHour } from '../dates.ts';

/**
 * A fuel's newest day with readings, and its newest whole day (YYYY-MM-DD).
 * Bright's readings come a day or so late, so the newest day is often only
 * partly in: it's whole once it reaches its last hour. Gas is often really 0
 * late in the evening, so for gas electricity past the end of the day also
 * counts (Bright usually gets both fuels together).
 */
export function lastWholeDay(ranges: Map<Fuel, { first: number; last: number }>, fuel: Fuel) {
	const range = ranges.get(fuel);
	if (!range) return null;
	const last = dayOf(range.last);
	const elec = ranges.get('electricity')?.last;
	const whole =
		ukHour(range.last) === 23 ||
		(fuel === 'gas' &&
			elec !== undefined &&
			(dayOf(elec) > last || (dayOf(elec) === last && ukHour(elec) === 23)));
	return { last, lastWhole: whole ? last : addDays(last, -1), whole };
}

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
