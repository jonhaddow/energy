<script lang="ts">
	import type { LayoutProps } from './$types';
	import { beforeNavigate, onNavigate } from '$app/navigation';
	import { updated, page } from '$app/state';
	// Served with the app (not Google Fonts): no extra connections before text shows.
	import '@fontsource-variable/space-grotesk';
	import font from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url';
	import './app.css';

	let { children }: LayoutProps = $props();

	// A new version was deployed: load it fully on the next tap.
	beforeNavigate(({ willUnload, to }) => {
		if (updated.current && !willUnload && to?.url) location.href = to.url.href;
	});

	// Coming back to the app from the background: if a new version was deployed
	// meanwhile, load it straight away.
	async function reloadIfUpdated() {
		if (document.visibilityState === 'visible' && (await updated.check())) location.reload();
	}

	// Pages crossfade into each other (app.css), where the browser can.
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

<svelte:document onvisibilitychange={reloadIfUpdated} />

{@render children()}
