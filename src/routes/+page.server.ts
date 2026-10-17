import { FUELS, type Fuel } from '#lib/server/db/schema.ts';
import { fuelMonths, syncInfo } from '#lib/server/usage.ts';
import { dayOf } from '#lib/dates.ts';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url, locals }) => {
	const param = url.searchParams.get('fuel');
	const fuel: Fuel = FUELS.includes(param as Fuel) ? (param as Fuel) : 'electricity';
	const today = dayOf(Math.floor(Date.now() / 1000));
	const [months, sync] = await Promise.all([
		fuelMonths(locals.db, fuel, today.slice(0, 7)),
		syncInfo(locals.db, fuel)
	]);
	return { fuel, months, sync, today };
};
