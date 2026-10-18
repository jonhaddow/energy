import { fail } from '@sveltejs/kit';
import { dayOf } from '#lib/dates.ts';
import { addQuote, allQuotes, readQuoteForm, removeQuote } from '#lib/server/quotes.ts';
import { allTariffs } from '#lib/server/tariffs.ts';
import { fuelMonths } from '#lib/server/usage.ts';
import { addMonths, latestWhole, twelveMonthsTo, yearCost, type Rates } from '#lib/usage.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const today = dayOf(Math.floor(Date.now() / 1000));
	const thisMonth = today.slice(0, 7);
	const [electricity, gas, tariffs, quotes] = await Promise.all([
		fuelMonths(locals.db, 'electricity', thisMonth),
		fuelMonths(locals.db, 'gas', thisMonth),
		allTariffs(locals.db),
		allQuotes(locals.db)
	]);
	// The same 12 months for both fuels: to the older of their newest whole months.
	const [ee, ge] = [latestWhole(electricity), latestWhole(gas)];
	const to = ee && ge && (ee < ge ? ee : ge);
	const e = to ? twelveMonthsTo(electricity, to) : null;
	const g = to ? twelveMonthsTo(gas, to) : null;
	if (!to || e === null || g === null) return { use: null, now: null, quotes: [] };
	const kwh = { electricity: e, gas: g };

	// Newest first, so the first that's started is today's.
	const current = (fuel: string) => tariffs.find((t) => t.fuel === fuel && t.from <= today);
	const ce = current('electricity');
	const cg = current('gas');
	const now = ce && cg ? yearCost(kwh, { electricity: ce, gas: cg }) : null;

	return {
		use: { from: addMonths(to, -11), to, ...kwh },
		now,
		quotes: quotes
			.map((q) => {
				const rates: Rates = {
					electricity: {
						unitPence: q.electricityUnitPence,
						standingPence: q.electricityStandingPence
					},
					gas: { unitPence: q.gasUnitPence, standingPence: q.gasStandingPence }
				};
				return { ...q, cost: yearCost(kwh, rates) };
			})
			.sort((a, b) => a.cost.total - b.cost.total)
	};
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		const input = readQuoteForm(await request.formData());
		if (!input) return fail(400, { error: 'Check the name and prices' });
		await addQuote(locals.db, input);
	},
	remove: async ({ request, locals }) => {
		await removeQuote(locals.db, Number((await request.formData()).get('id')));
	}
};
