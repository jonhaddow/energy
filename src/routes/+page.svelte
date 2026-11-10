<script lang="ts">
	import type { PageProps } from './$types';
	import StackedBars from '#lib/components/StackedBars.svelte';
	import { MONTHS, daysInMonth, formatDay } from '#lib/dates.ts';
	import { formatPence, formatPounds, formatPercent } from '#lib/format.ts';
	import { FUELS, verdict, type Use } from '#lib/home.ts';

	let { data }: PageProps = $props();

	const names = { electricity: 'Electricity', gas: 'Gas' };
	const monthName = new Intl.DateTimeFormat('en-GB', { month: 'long', timeZone: 'UTC' });
	const longMonth = (month: string) => monthName.format(new Date(`${month}-15T12:00:00Z`));
	const shortMonth = (month: string) => MONTHS[Number(month.slice(5, 7)) - 1];
	const sum = (xs: (number | null)[]) => xs.reduce<number>((s, x) => s + (x ?? 0), 0);

	/** "↓ £9 less" / "↑ 12% more", and whether that's good. */
	const change = (now: number, before: number, as: 'gbp' | 'percent') => {
		const less = now < before;
		const amount =
			as === 'gbp' ? formatPounds(Math.abs(now - before)) : formatPercent(now / before - 1);
		return { less, text: `${less ? '↓' : '↑'} ${amount} ${less ? 'less' : 'more'}` };
	};

	const h = $derived(data.home);

	// This month so far, for the fuels with readings, against the same fuels a year before.
	const top = $derived.by(() => {
		if (!h) return null;
		const shown = FUELS.filter((f) => h.fuels[f].now?.pence != null);
		const now = sum(shown.map((f) => h.fuels[f].now!.pence));
		const comparable = shown.length > 0 && shown.every((f) => h.fuels[f].before?.pence != null);
		const before = comparable ? sum(shown.map((f) => h.fuels[f].before!.pence)) : null;
		const whole = Number(h.upTo.slice(8)) === daysInMonth(h.month);
		const days = `${whole ? '' : `1–${Number(h.upTo.slice(8))} `}${shortMonth(h.month)}`;
		return { shown, now, before, whole, days };
	});

	const fuelChange = (u: { now: Use | null; before: Use | null }) =>
		u.now?.pence != null && u.before?.pence ? change(u.now.pence, u.before.pence, 'percent') : null;

	// The months chart: tap a month to see it; the newest whole one to start with.
	let picked = $state<string>();
	const months = $derived(h?.year.filter((m) => m.electricity !== null || m.gas !== null) ?? []);
	const month = $derived(
		months.find((m) => m.month === picked) ?? months.findLast((m) => !m.partial) ?? months.at(-1)
	);
</script>

<svelte:head>
	<title>Energy</title>
</svelte:head>

<main class="page">
	<header>
		<h1>Energy</h1>
		<a class="settings" href="/settings" aria-label="Settings">
			<!-- Lucide's settings cog. -->
			<svg viewBox="0 0 24 24" aria-hidden="true"
				><path
					d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"
				/><circle cx="12" cy="12" r="3" /></svg
			>
		</a>
	</header>

	{#if !h || !top}
		<p class="card empty muted">
			No readings yet. They’ll appear after the first sync with Bright.
		</p>
	{:else}
		<section class="card month">
			<h2>{longMonth(h.month)}{top.whole ? '' : ' so far'}</h2>
			<p class="big">{formatPounds(top.now)}</p>
			{#if top.before !== null}
				{@const c = change(top.now, top.before, 'gbp')}
				<p>
					<span class={c.less ? 'good' : 'over'}>{c.text}</span>
					<span class="muted">than {top.days} last year</span>
				</p>
			{/if}
			<div class="fuels">
				{#each FUELS as f (f)}
					{@const u = h.fuels[f]}
					{@const c = fuelChange(u)}
					<div>
						<p><span class="key {f}"></span>{names[f]}</p>
						{#if u.now?.pence != null}
							<p class="amount">{formatPounds(u.now.pence)}</p>
							{#if c}<p class={c.less ? 'good' : 'over'}>{c.text}</p>{/if}
							{#if f === 'gas' && h.weather}
								{@const w = h.weather}
								<p class="muted small">
									{formatPercent(w.colder)}
									{w.colder < 0 ? 'milder' : 'colder'}; allowing for that,
									{formatPercent(w.change)}
									{w.change < 0 ? 'less' : 'more'} gas
								</p>
							{/if}
						{:else}
							<p class="muted small">No readings</p>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		{@const y = h.yesterday}
		{#if y.pence !== null}
			<a class="card yesterday" href="/now?day={y.day}">
				<h2>{formatDay(y.day)}</h2>
				<div class="row">
					<p class="mid">{formatPence(y.pence)}</p>
					{#if y.usualPence}
						<p class="muted">
							{verdict(y.pence, y.usualPence)}<span class="small"
								>{verdict(y.pence, y.usualPence) === 'about usual'
									? ''
									: ` (usually ${formatPence(y.usualPence)})`}</span
							>
						</p>
					{/if}
				</div>
				<p class="muted small">
					{FUELS.filter((f) => y.fuels[f]?.pence != null)
						.map((f) => `${names[f]} ${formatPence(y.fuels[f]!.pence!)}`)
						.join(' · ')}
				</p>
			</a>
		{/if}

		<section class="card">
			<h2>Last 30 days</h2>
			<StackedBars
				label="Cost each day"
				bars={h.bars.map((b, i) => ({
					key: b.day,
					name: formatDay(b.day),
					label: (h.bars.length - 1 - i) % 7 === 0 ? formatDay(b.day).slice(4) : undefined,
					electricity: b.electricity,
					gas: b.gas,
					href: `/now?day=${b.day}`
				}))}
			/>
			<p class="legend">
				<span><span class="key electricity"></span>Electricity</span>
				<span><span class="key gas"></span>Gas</span>
				<span class="muted">Tap a day for its hours</span>
			</p>
		</section>

		{#if month}
			<section class="card">
				<h2>Month by month</h2>
				<div class="caption">
					<p>
						<b>{longMonth(month.month)} {month.month.slice(0, 4)}{month.partial ? ' so far' : ''}</b
						>
						{formatPounds(sum([month.electricity, month.gas]))}
					</p>
					{#if month.lastYear !== null && !month.partial}
						<p class="muted">a year before {formatPounds(month.lastYear)}</p>
					{/if}
				</div>
				<StackedBars
					label="Cost each month, against a year before"
					selected={month.month}
					onselect={(m: string) => {
						picked = m;
					}}
					bars={months.map((m) => ({
						key: m.month,
						name: `${longMonth(m.month)} ${m.month.slice(0, 4)}`,
						label: shortMonth(m.month).slice(0, 1),
						electricity: m.electricity,
						gas: m.gas,
						lastYear: m.lastYear,
						partial: m.partial
					}))}
				/>
				<p class="legend">
					<span><span class="key electricity"></span>Electricity</span>
					<span><span class="key gas"></span>Gas</span>
					<span><span class="key last"></span>A year before</span>
				</p>
			</section>
		{/if}
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
	</footer>
</main>

<style>
	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.settings {
		display: flex;
		padding: 6px;
		margin: -6px;
		color: var(--muted);
	}
	.settings svg {
		width: 22px;
		height: 22px;
		fill: none;
		stroke: currentColor;
		stroke-width: 2;
		stroke-linecap: round;
		stroke-linejoin: round;
	}
	.card {
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.card h2 {
		margin-bottom: 4px;
	}
	.empty {
		text-align: center;
	}
	.big {
		font-size: 52px;
		font-weight: 600;
		line-height: 1.05;
		letter-spacing: -0.03em;
	}
	.mid {
		font-size: 30px;
		font-weight: 600;
		letter-spacing: -0.02em;
	}
	.amount {
		font-size: 22px;
		font-weight: 600;
	}
	.fuels {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 12px;
		margin-top: 12px;
		padding-top: 12px;
		border-top: 1px solid var(--line);
	}
	.fuels > div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.yesterday {
		text-decoration: none;
	}
	.row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 12px;
	}
	.key {
		display: inline-block;
		width: 9px;
		height: 9px;
		border-radius: 2px;
		margin-right: 6px;
	}
	.key.electricity {
		background: var(--accent);
	}
	.key.gas {
		background: var(--gas);
	}
	.key.last {
		width: 14px;
		height: 0;
		border-top: 2px solid var(--ink);
		border-radius: 0;
		vertical-align: middle;
	}
	.legend {
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
		margin-top: 8px;
		font-size: 13px;
	}
	.legend .muted {
		margin-left: auto;
	}
	.caption {
		display: flex;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 4px 12px;
		margin-bottom: 8px;
		font-size: 15px;
	}
	.caption b {
		font-weight: 600;
		margin-right: 6px;
	}
	.good {
		color: var(--good);
		font-weight: 600;
	}
	.over {
		font-weight: 600;
	}
	.small {
		font-size: 13px;
	}
	footer {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		text-align: center;
	}
</style>
