import { fail } from '@sveltejs/kit';
import type { Fuel } from '#lib/server/db/schema.ts';
import { allTariffs, readTariffForm, removeTariff, saveTariff } from '#lib/server/tariffs.ts';
import { findPlace, getLocation, saveLocation } from '#lib/server/weather.ts';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const [tariffs, location] = await Promise.all([allTariffs(locals.db), getLocation(locals.db)]);
	return { tariffs, location };
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
	remove: async ({ request, locals }) => {
		const form = await request.formData();
		await removeTariff(locals.db, form.get('fuel') as Fuel, String(form.get('from')));
	}
};
