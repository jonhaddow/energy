<script lang="ts">
	import type { PageProps } from './$types';
	import DayChart from '#lib/components/DayChart.svelte';
	import { addDays, formatDay } from '#lib/dates.ts';
	import { formatPence, formatPercent, formatSmallKwh } from '#lib/format.ts';

	let { data }: PageProps = $props();

	const href = (fuel: string, day?: string) =>
		'/now?' + new URLSearchParams({ ...(fuel === 'gas' && { fuel }), ...(day && { day }) });
	const fuels = [
		{ value: 'electricity', label: 'Electricity' },
		{ value: 'gas', label: 'Gas' }
	];
	const dayName = (day: string, today: string) =>
		day === today ? 'Today' : day === addDays(today, -1) ? 'Yesterday' : formatDay(day);
</script>

<svelte:head>
	<title>Now · Energy</title>
</svelte:head>

<main class="page">
	<header>
		<a class="back" href="/">‹ Back</a>
		<nav class="segments" aria-label="Fuel">
			{#each fuels as f (f.value)}
				<a href={href(f.value)} aria-current={data.fuel === f.value ? 'page' : undefined}
					>{f.label}</a
				>
			{/each}
		</nav>
	</header>

	{#if !data.use}
		<p class="card empty muted">No readings yet. They’ll appear after a sync with Bright.</p>
	{:else}
		{@const u = data.use}
		<nav class="days" aria-label="Day">
			{#if u.before}<a href={href(data.fuel, u.before)} aria-label="Day before">‹</a>{:else}<span
				></span>{/if}
			<h1>{dayName(u.day, u.today)}</h1>
			{#if u.after}<a href={href(data.fuel, u.after)} aria-label="Day after">›</a>{:else}<span
				></span>{/if}
		</nav>

		<section class="card headline">
			<p class="big">{formatSmallKwh(u.kwh)}</p>
			{#if u.upTo !== null}
				<p class="muted">So far: readings up to {String(u.upTo + 1).padStart(2, '0')}:00</p>
			{:else if u.typicalKwh}
				{@const change = u.kwh / u.typicalKwh - 1}
				{#if Math.abs(change) < 0.005}
					<p>About the same as a typical day</p>
				{:else}
					<p class={change < 0 ? 'good' : 'over'}>
						{change < 0 ? '↓' : '↑'}
						{formatPercent(change)}
						{change < 0 ? 'less' : 'more'} than a typical day
						<span class="muted">({formatSmallKwh(u.typicalKwh)})</span>
					</p>
				{/if}
			{/if}
			{#if u.pence !== null}
				<p class="muted small">
					{formatPence(u.pence)}, with the {formatPence(u.standingPence!)} standing charge
				</p>
			{/if}
		</section>

		<section class="card chart">
			<h2>Hour by hour</h2>
			<DayChart hours={u.hours} typical={u.typical} upTo={u.upTo} />
			{#if u.typical}
				<p class="muted small">
					Typical: the average of the {u.typicalDays} whole days in the four weeks before.
				</p>
			{/if}
		</section>
	{/if}
</main>

<style>
	header {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.card {
		padding: 18px;
	}
	.empty {
		text-align: center;
	}
	.days {
		display: grid;
		grid-template-columns: 48px 1fr 48px;
		align-items: center;
		text-align: center;
	}
	.days a {
		display: flex;
		align-items: center;
		justify-content: center;
		min-height: 44px;
		font-size: 24px;
		text-decoration: none;
		color: var(--muted);
	}
	.headline {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.big {
		font-size: 52px;
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.03em;
		color: var(--accent);
	}
	.good {
		color: var(--good);
		font-weight: 600;
	}
	.over {
		font-weight: 600;
	}
	.chart {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.small {
		font-size: 13px;
	}
</style>
