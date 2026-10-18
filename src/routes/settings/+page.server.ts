import { fail } from '@sveltejs/kit';
import type { Fuel } from '#lib/server/db/schema.ts';
import { allTariffs, readTariffForm, removeTariff, saveTariff } from '#lib/server/tariffs.ts';
import { allTypical, readTypicalForm, saveTypical } from '#lib/server/typical.ts';
import { findPlace, getLocation, saveLocation } from '#lib/server/weather.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [tariffs, location, typical] = await Promise.all([
		allTariffs(locals.db),
		getLocation(locals.db),
		allTypical(locals.db)
	]);
	return { tariffs, location, typical };
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		const input = readTariffForm(await request.formData());
		if (!input) return fail(400, { error: 'Check the date and prices' });
		await saveTariff(locals.db, input);
	},
	location: async ({ request, locals }) => {
		const name = String((await request.formData()).get('place') ?? '').trim();
		if (!name) return fail(400, { placeError: 'Type a town' });
		const place = await findPlace(name);
		if (!place) return fail(400, { placeError: `Couldn’t find ${name}` });
		await saveLocation(locals.db, place);
	},
	typical: async ({ request, locals }) => {
		const rows = readTypicalForm(await request.formData());
		if (!rows) return fail(400, { typicalError: 'Whole kWh, low to high' });
		await saveTypical(locals.db, rows);
	},
	remove: async ({ request, locals }) => {
		const form = await request.formData();
		await removeTariff(locals.db, form.get('fuel') as Fuel, String(form.get('from')));
	}
};
