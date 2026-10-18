<script lang="ts">
	import YearChart from '#lib/components/YearChart.svelte';
	import { MONTHS, formatDay, formatMonths } from '#lib/dates.ts';
	import { formatAmount, formatPercent } from '#lib/format.ts';
	import { byYear, compare, valueOf } from '#lib/usage.ts';

	let { data } = $props();

	const years = $derived(byYear(data.months));
	const shown = $derived(years.slice(0, 3));
	const vsLastYear = $derived(compare(data.months, data.unit));
	/** This month in the chart: the newest month with data. */
	const latest = $derived(data.months.at(-1));
	const selected = $derived(latest ? Number(latest.month.slice(5, 7)) - 1 : 0);
	/** The parts of a £ change worth a line: rounding to £0 isn't. */
	const whyLines = (why: { use: number; prices: number }) =>
		[
			{ label: why.use < 0 ? 'Using less' : 'Using more', value: why.use },
			{ label: why.prices < 0 ? 'Lower prices' : 'Higher prices', value: why.prices }
		]
			.filter((l) => Math.round(l.value) !== 0)
			.map((l) => ({
				label: l.label,
				amount: `${l.value < 0 ? '−' : '+'}${formatAmount(Math.abs(l.value), 'gbp')}`
			}));

	const href = (fuel: string, unit: string) =>
		'/?' + new URLSearchParams({ fuel, ...(unit === 'gbp' && { unit }) });
	const fuels = [
		{ value: 'electricity', label: 'Electricity' },
		{ value: 'gas', label: 'Gas' },
		{ value: 'both', label: 'Both' }
	];
	const units = [
		{ value: 'kwh', label: 'kWh' },
		{ value: 'gbp', label: '£' }
	];
</script>

<svelte:head>
	<title>Energy</title>
</svelte:head>

<main class="page wide">
	<header>
		<h1>Energy</h1>

		<div class="switches">
			<nav class="segments" aria-label="Fuel">
				{#each fuels as f (f.value)}
					<a
						href={href(f.value, data.unit)}
						aria-current={data.fuel === f.value ? 'page' : undefined}>{f.label}</a
					>
				{/each}
			</nav>
			<nav class="segments" aria-label="Units">
				{#each units as u (u.value)}
					<a
						href={href(data.fuel, u.value)}
						aria-current={data.unit === u.value ? 'page' : undefined}>{u.label}</a
					>
				{/each}
			</nav>
		</div>
	</header>

	{#if !years.length}
		<p class="card empty muted">
			No readings yet. They’ll appear after the first sync with Bright.
		</p>
	{:else}
		{#if vsLastYear}
			{@const less = vsLastYear.change < 0}
			<section class="card headline">
				<p class="muted">{formatMonths(vsLastYear.from, vsLastYear.to)}</p>
				<p class="big">{formatAmount(vsLastYear.value, data.unit)}</p>
				<p class={less ? 'good' : 'over'}>
					{less ? '↓' : '↑'}
					{formatPercent(vsLastYear.change)}
					{less ? 'less' : 'more'} than a year before
					<span class="muted">({formatAmount(vsLastYear.beforeValue, data.unit)})</span>
				</p>
				{#if vsLastYear.why}
					<ul class="why">
						{#each whyLines(vsLastYear.why) as line (line.label)}
							<li>
								<span>{line.label}</span>
								<strong>{line.amount}</strong>
							</li>
						{/each}
					</ul>
				{/if}
				{#if data.weather}
					{@const w = data.weather}
					<p class="adjusted">
						Allowing for the weather:
						<span class={w.change < 0 ? 'good' : 'over'}
							>{formatPercent(w.change)} {w.change < 0 ? 'less' : 'more'} gas</span
						>
						<span class="muted small"
							>(it was {formatPercent(w.colder)} {w.colder < 0 ? 'warmer' : 'colder'})</span
						>
					</p>
				{/if}
				{#if data.fixedPence !== null}
					<p class="fixed muted small">
						Standing charges: {formatAmount(data.fixedPence / 100, 'gbp')} a year, before using anything
					</p>
				{/if}
			</section>
		{/if}

		<section class="card chart">
			<h2>Month by month</h2>
			<YearChart {years} {selected} unit={data.unit} priceChanges={data.priceChanges} />
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
								{@const v = valueOf(m, data.unit)}
								<td class:muted={m?.partial}>
									{v === null ? '' : Math.round(v).toLocaleString('en-GB')}{v !== null && m?.partial
										? '*'
										: ''}
								</td>
							{/each}
						</tr>
					{/each}
				</tbody>
			</table>
			<p class="muted small">
				{data.unit === 'kwh' ? 'kWh' : '£, from the prices in Settings'}. * so far, or not a full
				month of readings.
			</p>
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
	header {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	/* Laptops: the headline and table down the left, the chart beside them. */
	@media (min-width: 960px) {
		main {
			display: grid;
			grid-template-columns: 380px minmax(0, 1fr);
			grid-template-areas:
				'top top'
				'headline chart'
				'table chart'
				'foot foot';
			grid-template-rows: auto auto 1fr auto;
			align-items: start;
		}
		header {
			grid-area: top;
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
		.switches {
			width: 440px;
		}
		.empty {
			grid-column: 1 / -1;
		}
		.headline {
			grid-area: headline;
		}
		.chart {
			grid-area: chart;
			position: sticky;
			top: 24px;
		}
		.table {
			grid-area: table;
		}
		footer {
			grid-area: foot;
		}
	}
	.switches {
		display: grid;
		grid-template-columns: 1fr auto;
		gap: 8px;
	}
	/* Tabs as wide as their words, so "Electricity" fits beside the units. */
	.switches .segments {
		grid-auto-columns: auto;
	}
	.switches .segments > * {
		padding: 0 12px;
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
		font-size: 52px;
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.03em;
		color: var(--accent);
	}
	.why {
		list-style: none;
		margin: 10px 0 0;
		padding: 10px 0 0;
		border-top: 1px solid var(--line);
		display: flex;
		flex-direction: column;
		gap: 4px;
		font-size: 15px;
	}
	.why li {
		display: flex;
		justify-content: space-between;
	}
	.adjusted,
	.fixed {
		margin-top: 10px;
		padding-top: 10px;
		border-top: 1px solid var(--line);
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
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.12em;
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
