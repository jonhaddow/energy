import { fail } from '@sveltejs/kit';
import { FUELS, type Fuel } from '#lib/server/db/schema.ts';
import { allTariffs, readTariffForm, removeTariff, saveTariff } from '#lib/server/tariffs.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => ({
	tariffs: await allTariffs(locals.db)
});

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const input = readTariffForm(await request.formData());
		if (!input) return fail(400, { error: 'Check the date and prices' });
		await saveTariff(locals.db, input);
	},
	remove: async ({ request, locals }) => {
		const form = await request.formData();
		const fuel = form.get('fuel') as Fuel;
		if (!FUELS.includes(fuel)) return fail(400, { error: 'Unknown fuel' });
		await removeTariff(locals.db, fuel, String(form.get('from')));
	}
};
