<script lang="ts">
	import YearChart from '#lib/components/YearChart.svelte';
	import { MONTHS, formatDay } from '#lib/dates.ts';
	import { formatKwh, formatPercent } from '#lib/format.ts';
	import { byYear, compare } from '#lib/usage.ts';

	let { data } = $props();

	const years = $derived(byYear(data.months));
	const shown = $derived(years.slice(0, 3));
	const vsLastYear = $derived(years.length > 1 ? compare(years[0], years[1]) : null);
	/** This month in the chart: the newest month with data. */
	const latest = $derived(data.months.at(-1));
	const selected = $derived(latest ? Number(latest.month.slice(5, 7)) - 1 : 0);
	const span = (months: number[]) =>
		months.length === 1 ? MONTHS[months[0]] : `${MONTHS[months[0]]}–${MONTHS[months.at(-1)!]}`;

	const fuels = [
		{ value: 'electricity', label: 'Electricity', href: '/' },
		{ value: 'gas', label: 'Gas', href: '/?fuel=gas' }
	];
</script>

<svelte:head>
	<title>Energy</title>
</svelte:head>

<main class="page">
	<h1>Energy</h1>

	<nav class="segments" aria-label="Fuel">
		{#each fuels as f (f.value)}
			<a href={f.href} aria-current={data.fuel === f.value ? 'page' : undefined}>{f.label}</a>
		{/each}
	</nav>

	{#if !years.length}
		<p class="card empty muted">
			No readings yet. They’ll appear after the first sync with Bright.
		</p>
	{:else}
		{#if vsLastYear}
			{@const less = vsLastYear.change < 0}
			<section class="card headline">
				<p class="muted">{span(vsLastYear.months)} {years[0].year}</p>
				<p class="big">{formatKwh(vsLastYear.kwh)}</p>
				<p class={less ? 'good' : 'over'}>
					{less ? '↓' : '↑'}
					{formatPercent(vsLastYear.change)}
					{less ? 'less' : 'more'} than {years[1].year}
					<span class="muted">({formatKwh(vsLastYear.beforeKwh)})</span>
				</p>
			</section>
		{/if}

		<section class="card chart">
			<h2>Month by month</h2>
			<YearChart {years} {selected} />
		</section>

		<section class="card table">
			<table>
				<thead>
					<tr>
						<th scope="col">Month</th>
						{#each shown as yr (yr.year)}<th scope="col">{yr.year}</th>{/each}
					</tr>
				</thead>
				<tbody>
					{#each MONTHS as label, i (label)}
						<tr>
							<th scope="row">{label}</th>
							{#each shown as yr (yr.year)}
								{@const m = yr.months[i]}
								<td class:muted={m?.partial}>
									{m ? Math.round(m.kwh).toLocaleString('en-GB') : ''}{m?.partial ? '*' : ''}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="muted small">kWh. * so far, or not a full month of readings.</p>
		</section>
	{/if}

	<footer class="muted small">
		{#if data.sync.status?.lastError}
			<p class="over">Last sync failed: {data.sync.status.lastError}</p>
		{/if}
		{#if data.sync.latestDay}
			<p>Meter readings up to {formatDay(data.sync.latestDay)}</p>
		{:else if !data.sync.status}
			<p>Not syncing with Bright yet.</p>
		{/if}
		<a class="link" href="/settings">Settings</a>
	</footer>
</main>

<style>
	.card {
		padding: 18px;
	}
	.empty {
		text-align: center;
	}
	.headline {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.big {
		font-size: 34px;
		font-weight: 700;
		letter-spacing: -0.5px;
	}
	.good {
		color: var(--good);
		font-weight: 600;
	}
	.over {
		font-weight: 600;
	}
	.chart h2 {
		margin-bottom: 10px;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 15px;
	}
	th,
	td {
		padding: 7px 4px;
		text-align: right;
	}
	th:first-child {
		text-align: left;
	}
	thead th {
		font-size: 13px;
		color: var(--muted);
	}
	tbody tr + tr > * {
		border-top: 1px solid var(--line);
	}
	tbody th {
		font-weight: 500;
	}
	.small {
		font-size: 13px;
	}
	.table .small {
		margin-top: 8px;
	}
	footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		text-align: center;
	}
	.link {
		padding: 8px;
		color: var(--muted);
	}
</style>
