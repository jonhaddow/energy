// A day's use hour by hour, against a typical day.
import { ukHour } from './dates.ts';

export type HalfHour = { start: number; day: string; wh: number };

/** Readings that make a day whole: 48 half hours, give or take a clock change. */
const WHOLE_DAY = 46;

/** kWh in each UK hour (0–23) of the half hours given. */
function byHour(rows: HalfHour[]) {
	const hours = new Array<number>(24).fill(0);
	for (const r of rows) hours[ukHour(r.start)] += r.wh / 1000;
	return hours;
}

/**
 * `day` hour by hour, and a typical day: the average of the whole days before it
 * in `rows`. Bright stores a missing reading as 0, so a day with none above 0
 * isn't whole either.
 */
export function dayUse(rows: HalfHour[], day: string) {
	const days = Map.groupBy(rows, (r) => r.day);
	const hours = byHour(days.get(day) ?? []);
	const whole = [...days]
		.filter(([d, rs]) => d < day && rs.length >= WHOLE_DAY && rs.some((r) => r.wh > 0))
		.map(([, rs]) => byHour(rs));
	const typical = whole.length
		? hours.map((_, h) => whole.reduce((sum, w) => sum + w[h], 0) / whole.length)
		: null;
	return { hours, typical, typicalDays: whole.length };
}

export const total = (hours: number[]) => hours.reduce((a, b) => a + b, 0);
