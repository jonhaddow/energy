import { error, redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit/hooks';
import { env } from 'cloudflare:workers';
import { drizzle } from 'drizzle-orm/d1';
import * as schema from '#lib/server/db/schema.ts';
import { SESSION_COOKIE, setSessionCookie, validateSession } from '#lib/server/auth.ts';
import { THEME_COOKIE, themeColourMeta, themeOf } from '#lib/theme.ts';

/** Pages anyone can reach without signing in. */
const PUBLIC = [
	/^\/login$/,
	/^\/auth\//,
	// Called by the hourly cron, which sends a secret.
	/^\/sync$/
];

/** Sent with every page and endpoint (the CSP itself is configured in vite.config.ts). */
const SECURITY_HEADERS = {
	'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
	'X-Frame-Options': 'DENY',
	'X-Content-Type-Options': 'nosniff',
	'Referrer-Policy': 'same-origin',
	'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
};

export const handle: Handle = async ({ event, resolve }) => {
	const db = drizzle(env.DB, { schema });
	event.locals.db = db;
	event.locals.user = null;

	const token = event.cookies.get(SESSION_COOKIE);
	if (token) {
		const result = await validateSession(db, token);
		if (result) {
			event.locals.user = result.user;
			if (result.renewed) setSessionCookie(event.cookies, token, result.expiresAt);
		} else {
			event.cookies.delete(SESSION_COOKIE, { path: '/' });
		}
	}

	const path = event.url.pathname;
	if (!event.locals.user && !PUBLIC.some((p) => p.test(path))) {
		if (event.request.method !== 'GET') error(401, 'Please sign in');
		redirect(303, `/login?next=${encodeURIComponent(path + event.url.search)}`);
	}

	// Rendered with the right theme, so there's no flash of the wrong one.
	const theme = themeOf(event.cookies.get(THEME_COOKIE));
	const response = await resolve(event, {
		transformPageChunk: ({ html }) =>
			html.replace('%theme%', theme).replace('%theme-color%', themeColourMeta(theme))
	});
	for (const [name, value] of Object.entries(SECURITY_HEADERS)) response.headers.set(name, value);
	// Pages name this build's files, which the next deploy deletes, so mustn't be saved
	// (worker/entry.js handles pages saved anyway).
	if (response.headers.get('content-type')?.startsWith('text/html'))
		response.headers.set('Cache-Control', 'no-store');
	return response;
};
