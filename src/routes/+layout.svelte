<script lang="ts">
	import type { LayoutProps } from './$types';
	import { beforeNavigate, onNavigate } from '$app/navigation';
	import { updated, page } from '$app/state';
	// Served with the app (not Google Fonts): no extra connections before text shows.
	import '@fontsource-variable/space-grotesk';
	import font from '@fontsource-variable/space-grotesk/files/space-grotesk-latin-wght-normal.woff2?url';
	import './app.css';

	let { data, children }: LayoutProps = $props();

	// Lucide's icons (24×24, stroked), inline: see the app-stack notes on @lucide/svelte.
	const tabs = [
		{ href: '/', label: 'Trends', icon: 'M3 3v16a2 2 0 0 0 2 2h16 M7 16l4-6 4 3 5-7' },
		{ href: '/now', label: 'Now', icon: 'M13 2 3 14h9l-1 8 10-12h-9l1-8z' },
		{
			href: '/quotes',
			label: 'Quotes',
			icon: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2 M9 3h6v4H9z M9 12h6 M9 16h4'
		},
		{
			href: '/settings',
			label: 'Settings',
			icon: 'M4 21v-7 M4 10V3 M12 21v-9 M12 8V3 M20 21v-5 M20 12V3 M1 14h6 M9 8h6 M17 16h6'
		}
	];

	// A new version was deployed: load it fully on the next tap.
	beforeNavigate(({ willUnload, to }) => {
		if (updated.current && !willUnload && to?.url) location.href = to.url.href;
	});

	// Coming back to the app from the background: if a new version was deployed
	// meanwhile, load it straight away.
	async function reloadIfUpdated() {
		if (document.visibilityState === 'visible' && (await updated.check())) location.reload();
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

<svelte:document onvisibilitychange={reloadIfUpdated} />

{@render children()}

{#if data.user && page.url.pathname !== '/login'}
	<nav class="tabs" aria-label="Pages">
		{#each tabs as t (t.href)}
			<a href={t.href} aria-current={page.url.pathname === t.href ? 'page' : undefined}>
				<svg viewBox="0 0 24 24" aria-hidden="true"><path d={t.icon} /></svg>
				{t.label}
			</a>
		{/each}
	</nav>
{/if}
