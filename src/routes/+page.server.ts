import { dayTotals, lastWholeDay, readingRange } from '#lib/server/day.ts';
import { fuelMonths, syncInfo } from '#lib/server/usage.ts';
import { allTariffs } from '#lib/server/tariffs.ts';
import { dailyDegreeDays } from '#lib/server/weather.ts';
import { dayOf } from '#lib/dates.ts';
import { addMonths } from '#lib/usage.ts';
import { FUELS, home } from '#lib/home.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const today = dayOf(Math.floor(Date.now() / 1000));
	const [ranges, sync, tariffs] = await Promise.all([
		readingRange(locals.db),
		// Both fuels sync together, so electricity speaks for both.
		syncInfo(locals.db, 'electricity'),
		allTariffs(locals.db)
	]);
	const lastWhole = lastWholeDay(ranges, 'electricity')?.lastWhole;
	if (!lastWhole) return { sync, home: null };

	// From the first of this month a year before: the comparison, the bars and the usual day.
	const from = `${addMonths(lastWhole.slice(0, 7), -12)}-01`;
	const thisMonth = today.slice(0, 7);
	const [elecDays, gasDays, elecMonths, gasMonths, degreeDays] = await Promise.all([
		dayTotals(locals.db, 'electricity', from, lastWhole),
		dayTotals(locals.db, 'gas', from, lastWhole),
		fuelMonths(locals.db, 'electricity', thisMonth),
		fuelMonths(locals.db, 'gas', thisMonth),
		dailyDegreeDays(locals.db, from, lastWhole)
	]);
	const kwhByDay = (rows: { day: string; wh: number }[]) =>
		new Map(rows.map((r) => [r.day, r.wh / 1000]));
	const gas = ranges.get('gas');
	return {
		sync,
		home: home({
			lastWhole,
			days: { electricity: kwhByDay(elecDays), gas: kwhByDay(gasDays) },
			gasFrom: gas ? dayOf(gas.first) : null,
			// allTariffs is newest first.
			prices: Object.fromEntries(
				FUELS.map((f) => [f, tariffs.filter((t) => t.fuel === f).toReversed()])
			) as Record<(typeof FUELS)[number], typeof tariffs>,
			months: { electricity: elecMonths, gas: gasMonths },
			degreeDays: new Map(degreeDays.map((d) => [d.day, d.degreeDays]))
		})
	};
};
