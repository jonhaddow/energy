import { and, between, eq, gt, max, min } from 'drizzle-orm';
import { reading, type Fuel } from './db/schema.ts';
import type { DB } from './db/index.ts';

/**
 * The fuel's first half hour with a real reading, and the newest of either fuel
 * (unix seconds): Bright stores missing readings as 0, and gas is often really
 * 0 late in the evening, so electricity shows best how far the data's in.
 */
export async function readingRange(db: DB, fuel: Fuel) {
	const [[{ first }], [{ last }]] = await Promise.all([
		db
			.select({ first: min(reading.start) })
			.from(reading)
			.where(and(eq(reading.fuel, fuel), gt(reading.wh, 0))),
		db
			.select({ last: max(reading.start) })
			.from(reading)
			.where(gt(reading.wh, 0))
	]);
	return { first, last };
}

/** A fuel's half hours from `from` to `to` (YYYY-MM-DD, UK days). */
export const halfHours = (db: DB, fuel: Fuel, from: string, to: string) =>
	db
		.select({ start: reading.start, day: reading.day, wh: reading.wh })
		.from(reading)
		.where(and(eq(reading.fuel, fuel), between(reading.day, from, to)));
