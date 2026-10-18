import { fuelMonths, syncInfo } from '#lib/server/usage.ts';
import { FUELS } from '#lib/server/db/schema.ts';
import { allTariffs } from '#lib/server/tariffs.ts';
import { degreeDays } from '#lib/server/weather.ts';
import { combined, priceChanges, standingPerYear, weatherAdjusted, type Unit } from '#lib/usage.ts';
import { dayOf } from '#lib/dates.ts';
import type { PageServerLoad } from './$types';

const VIEWS = ['electricity', 'gas', 'both'] as const;
type View = (typeof VIEWS)[number];

export const load: PageServerLoad = async ({ url, locals }) => {
	const param = url.searchParams.get('fuel');
	const fuel: View = VIEWS.includes(param as View) ? (param as View) : 'electricity';
	const unit: Unit = url.searchParams.get('unit') === 'gbp' ? 'gbp' : 'kwh';
	const today = dayOf(Math.floor(Date.now() / 1000));
	const thisMonth = today.slice(0, 7);
	const [months, sync, tariffs, weather] = await Promise.all([
		fuel === 'both'
			? Promise.all([
					fuelMonths(locals.db, 'electricity', thisMonth),
					fuelMonths(locals.db, 'gas', thisMonth)
				]).then(([e, g]) => combined(e, g))
			: fuelMonths(locals.db, fuel, thisMonth),
		// Both fuels sync together, so electricity speaks for both.
		syncInfo(locals.db, fuel === 'both' ? 'electricity' : fuel),
		allTariffs(locals.db),
		fuel === 'gas' ? degreeDays(locals.db) : []
	]);
	// Oldest first, for each fuel in view.
	const prices = (fuel === 'both' ? FUELS : [fuel]).map((f) =>
		tariffs.filter((t) => t.fuel === f).toReversed()
	);
	return {
		fuel,
		unit,
		months,
		sync,
		today,
		/** Standing charges a year at today's prices, in pence. */
		fixedPence: unit === 'gbp' ? standingPerYear(prices, today) : null,
		priceChanges: unit === 'gbp' ? priceChanges(...prices) : [],
		/** Gas only: the year-on-year change allowing for the weather. */
		weather: fuel === 'gas' ? weatherAdjusted(months, weather) : null
	};
};
