import { THEME_COOKIE, themeOf } from '#lib/theme.ts';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, cookies }) => ({
	user: locals.user && { name: locals.user.name, email: locals.user.email },
	theme: themeOf(cookies.get(THEME_COOKIE))
});
