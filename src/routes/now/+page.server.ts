import { dayTotals, halfHours, lastWholeDay, readingRange } from '#lib/server/day.ts';
import { allTariffs } from '#lib/server/tariffs.ts';
import { addDays, dayOf, ukHour } from '#lib/dates.ts';
import { dayUse } from '#lib/day.ts';
import { unusual, weekSoFar, type DayTotal } from '#lib/days.ts';
import type { PageServerLoad } from './$types';

/** The typical day: the whole days in the four weeks before. */
const TYPICAL_DAYS = 28;
/** Days in the bar chart. */
const BARS = 30;
/** Days of totals: the bars, and this week with the four before it. */
const TOTALS = 35;

export const load: PageServerLoad = async ({ url, locals }) => {
	const fuel = url.searchParams.get('fuel') === 'gas' ? 'gas' : 'electricity';
	const ranges = await readingRange(locals.db);
	const range = ranges.get(fuel);
	if (!range) return { fuel, use: null };
	const first = dayOf(range.first);
	// Open on the newest whole day.
	const { last, lastWhole, whole: lastIsWhole } = lastWholeDay(ranges, fuel)!;
	const param = url.searchParams.get('day') ?? '';
	const day =
		/^\d{4}-\d{2}-\d{2}$/.test(param) && param >= first && param <= last ? param : lastWhole;

	const [rows, totals, tariffs] = await Promise.all([
		halfHours(locals.db, fuel, addDays(day, -TYPICAL_DAYS), day),
		dayTotals(locals.db, fuel, addDays(lastWhole, 1 - TOTALS), lastWhole),
		allTariffs(locals.db)
	]);
	// Newest first, so the first that's started is the day's.
	const priceOn = (d: string) => tariffs.find((t) => t.fuel === fuel && t.from <= d);
	const dayPence = (d: string, kwh: number) => {
		const p = priceOn(d);
		return p ? kwh * p.unitPence + p.standingPence : null;
	};
	const byDay = new Map(totals.map((t) => [t.day, t.wh / 1000]));
	const days: DayTotal[] = Array.from({ length: TOTALS }, (_, i) => {
		const d = addDays(lastWhole, i + 1 - TOTALS);
		const kwh = byDay.get(d) ?? 0;
		return { day: d, kwh, pence: dayPence(d, kwh) };
	});
	const bars = days.slice(-BARS);
	const use = dayUse(rows, day);
	return {
		fuel,
		use: {
			day,
			today: dayOf(Math.floor(Date.now() / 1000)),
			/** Only partly in: readings up to this UK hour. */
			upTo: day === last && !lastIsWhole ? ukHour(range.last) : null,
			before: day > first ? addDays(day, -1) : null,
			after: day < last ? addDays(day, 1) : null,
			...use,
			pence: dayPence(day, use.kwh),
			standingPence: priceOn(day)?.standingPence ?? null
		},
		bars,
		// Gas follows the weather, so its unusual days wait for weather-adjusted days.
		unusual: fuel === 'electricity' ? unusual(bars) : null,
		week: weekSoFar(days, lastWhole)
	};
};
