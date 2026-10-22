import { and, between, eq, gt, max, min } from 'drizzle-orm';
import { reading, type Fuel } from './db/schema.ts';
import type { DB } from './db/index.ts';

/** The first and last half hours with a real reading (unix seconds). */
export async function readingRange(db: DB, fuel: Fuel) {
	const [range] = await db
		.select({ first: min(reading.start), last: max(reading.start) })
		.from(reading)
		.where(and(eq(reading.fuel, fuel), gt(reading.wh, 0)));
	return range;
}

/** A fuel's half hours from `from` to `to` (YYYY-MM-DD, UK days). */
export const halfHours = (db: DB, fuel: Fuel, from: string, to: string) =>
	db
		.select({ start: reading.start, day: reading.day, wh: reading.wh })
		.from(reading)
		.where(and(eq(reading.fuel, fuel), between(reading.day, from, to)));
