/** Light, dark, or follow the device. Kept per device in a cookie. */
export const THEMES = ['system', 'light', 'dark'] as const;
export type Theme = (typeof THEMES)[number];

export const THEME_COOKIE = 'theme';

export const themeOf = (value: string | null | undefined): Theme =>
	value === 'light' || value === 'dark' ? value : 'system';

/** The page background, which the phone uses for its status bar. */
export const THEME_COLOURS = { light: '#f5f5f2', dark: '#0f1013' };

/** The <meta name="theme-color"> tags for a theme. */
export function themeColourMeta(theme: Theme) {
	if (theme !== 'system') return `<meta name="theme-color" content="${THEME_COLOURS[theme]}" />`;
	return (['light', 'dark'] as const)
		.map(
			(s) =>
				`<meta name="theme-color" media="(prefers-color-scheme: ${s})" content="${THEME_COLOURS[s]}" />`
		)
		.join('\n\t\t');
}
