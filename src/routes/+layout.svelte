<script lang="ts">
	import { beforeNavigate } from '$app/navigation';
	import { updated } from '$app/state';
	// Served with the app (not Google Fonts): no extra connections before text shows.
	import '@fontsource-variable/figtree';
	import figtree from '@fontsource-variable/figtree/files/figtree-latin-wght-normal.woff2?url';
	import './app.css';

	let { children } = $props();

	// A new version was deployed: load it fully on the next tap.
	beforeNavigate(({ willUnload, to }) => {
		if (updated.current && !willUnload && to?.url) location.href = to.url.href;
	});
</script>

<svelte:head>
	<link rel="preload" href={figtree} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

{@render children()}
