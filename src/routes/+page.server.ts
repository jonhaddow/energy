import { fuelMonths, syncInfo } from '#lib/server/usage.ts';
import { combined, type Unit } from '#lib/usage.ts';
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
	const [months, sync] = await Promise.all([
		fuel === 'both'
			? Promise.all([
					fuelMonths(locals.db, 'electricity', thisMonth),
					fuelMonths(locals.db, 'gas', thisMonth)
				]).then(([e, g]) => combined(e, g))
			: fuelMonths(locals.db, fuel, thisMonth),
		// Both fuels sync together, so electricity speaks for both.
		syncInfo(locals.db, fuel === 'both' ? 'electricity' : fuel)
	]);
	return { fuel, unit, months, sync, today };
};
