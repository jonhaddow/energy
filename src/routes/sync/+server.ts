import { error, json } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { signIn } from '#lib/server/glow.ts';
import { sync } from '#lib/server/sync.ts';
import { syncWeather } from '#lib/server/weather.ts';
import { dayOf } from '#lib/dates.ts';
import type { RequestHandler } from './$types';

/** Called by the hourly cron (worker/entry.js) with the sync secret. */
export const POST: RequestHandler = async ({ request, locals }) => {
	const secret = request.headers.get('x-sync-secret');
	if (!env.SYNC_SECRET || secret !== env.SYNC_SECRET) error(403);
	// Temperatures don't need Bright, and their failing shouldn't stop the readings.
	await syncWeather(locals.db, dayOf(Math.floor(Date.now() / 1000))).catch((e) =>
		console.error('Weather sync failed:', e)
	);
	if (!env.GLOW_USERNAME || !env.GLOW_PASSWORD) return json({ skipped: 'Bright not set up' });
	const result = await sync(locals.db, () => signIn(env.GLOW_USERNAME!, env.GLOW_PASSWORD!));
	if (result.error) console.error('Sync failed:', result.error);
	return json(result);
};
