// Day by day: the last few weeks, unusual days, and this week against a typical one.
import { addDays } from './dates.ts';

/** A day's use; 0 when Bright has nothing for it (it stores missing readings as 0). */
export type DayTotal = { day: string; kwh: number; pence: number | null };

/** Unusual: over half as much again as the median day, or under half of it. */
export function unusual(days: DayTotal[]) {
	const kwh = days
		.map((d) => d.kwh)
		.filter((k) => k > 0)
		.sort((a, b) => a - b);
	const median = kwh.length ? kwh[Math.floor(kwh.length / 2)] : 0;
	const marks = new Map<string, 'high' | 'low'>();
	for (const d of days) {
		if (d.kwh > median * 1.5) marks.set(d.day, 'high');
		else if (d.kwh > 0 && d.kwh < median / 2) marks.set(d.day, 'low');
	}
	return { median, marks };
}

const sum = (days: DayTotal[]) => ({
	kwh: days.reduce((s, d) => s + d.kwh, 0),
	pence: days.some((d) => d.pence === null) ? null : days.reduce((s, d) => s + d.pence!, 0)
});

/**
 * This week so far (Monday to `to`), and a typical week so far: the average of
 * the same days in the weeks before that have them all.
 */
export function weekSoFar(days: DayTotal[], to: string) {
	const byDay = new Map(days.map((d) => [d.day, d]));
	const length = ((new Date(`${to}T12:00:00Z`).getUTCDay() + 6) % 7) + 1;
	const span = (end: string) => {
		const ds = Array.from({ length }, (_, i) => byDay.get(addDays(end, -i)));
		return ds.every((d) => d && d.kwh > 0) ? sum(ds as DayTotal[]) : null;
	};
	const before = [1, 2, 3, 4].map((w) => span(addDays(to, -7 * w))).filter((w) => w !== null);
	const typical = before.length
		? {
				kwh: before.reduce((s, w) => s + w.kwh, 0) / before.length,
				pence: before.some((w) => w.pence === null)
					? null
					: before.reduce((s, w) => s + w.pence!, 0) / before.length
			}
		: null;
	return {
		from: addDays(to, 1 - length),
		to,
		...sum(days.filter((d) => d.day > addDays(to, -length) && d.day <= to)),
		typical,
		weeks: before.length
	};
}
