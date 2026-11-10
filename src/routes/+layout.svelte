<script lang="ts">
	import type { LayoutProps } from './$types';
	import { beforeNavigate, invalidateAll, onNavigate } from '$app/navigation';
	import { updated, page } from '$app/state';
	// Served with the app (not Google Fonts): no extra connections before text shows.
	import '@fontsource-variable/space-grotesk';
	import font from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url';
	import './app.css';

	let { data, children }: LayoutProps = $props();

	// A new version was deployed: load it fully on the next tap.
	beforeNavigate(({ willUnload, to }) => {
		if (updated.current && !willUnload && to?.url) location.href = to.url.href;
	});

	// Coming back to the app from the background: if a new version was deployed
	// meanwhile, load it straight away; otherwise reload the page's data, so it isn't
	// left showing what it had when the app was last open.
	async function onVisible() {
		if (document.visibilityState !== 'visible') return;
		if (await updated.check()) location.reload();
		else if (data.user) void invalidateAll();
	}

	// Pages crossfade into each other (app.css), where the browser can; not a change
	// of fuel or month on the same page.
	onNavigate((navigation) => {
		if (!document.startViewTransition || navigation.to?.url.pathname === page.url.pathname) return;
		return new Promise((resolve) => {
			document.startViewTransition(async () => {
				resolve();
				await navigation.complete;
			});
		});
	});
</script>

<svelte:head>
	<link rel="preload" href={font} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<svelte:document onvisibilitychange={onVisible} />

{@render children()}
