<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { updated } from '$app/state';
	// Served with the app (not Google Fonts): no extra connections before text shows.
	import '@fontsource-variable/space-grotesk';
	import font from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url';
	import './app.css';

	let { children } = $props();

	// A new version was deployed: load it fully on the next tap.
	beforeNavigate(({ willUnload, to }) => {
		if (updated.current && !willUnload && to?.url) location.href = to.url.href;
	});

	// Coming back to the app from the background: if a new version was deployed
	// meanwhile, load it straight away.
	async function reloadIfUpdated() {
		if (document.visibilityState === 'visible' && (await updated.check())) location.reload();
	}
</script>

<svelte:head>
	<link rel="preload" href={font} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<svelte:document onvisibilitychange={reloadIfUpdated} />

{@render children()}
