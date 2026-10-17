import { redirect } from '@sveltejs/kit';
import { Google, generateCodeVerifier, generateState } from 'arctic';
import { env } from 'cloudflare:workers';
import { safeBack } from '#lib/server/forms.ts';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ url, cookies }) => {
	const state = generateState();
	const verifier = generateCodeVerifier();
	const google = new Google(
		env.GOOGLE_CLIENT_ID,
		env.GOOGLE_CLIENT_SECRET,
		`${url.origin}/auth/callback`
	);
	const authUrl = google.createAuthorizationURL(state, verifier, ['openid', 'email', 'profile']);
	authUrl.searchParams.set('prompt', 'select_account');

	const opts = { path: '/', httpOnly: true, sameSite: 'lax' as const, maxAge: 600 };
	cookies.set('oauth_state', state, opts);
	cookies.set('oauth_verifier', verifier, opts);
	cookies.set('oauth_next', safeBack(url.searchParams.get('next')), opts);
	redirect(302, authUrl.toString(), { external: ['https://accounts.google.com'] });
};
