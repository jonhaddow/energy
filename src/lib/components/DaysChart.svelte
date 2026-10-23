<script lang="ts">
	import { formatDay } from '#lib/dates.ts';
	import type { DayTotal } from '#lib/days.ts';

	/** Oldest first; `marks`: unusual days; `selected`: the day shown above; `href`: a day's link. */
	let {
		days,
		marks,
		selected,
		href
	}: {
		days: DayTotal[];
		marks: Map<string, 'high' | 'low'> | null;
		selected: string;
		href: (day: string) => string;
	} = $props();

	const W = 340;
	const H = 120;
	const TOP = 10;
	const step = $derived(W / days.length);
	const max = $derived(Math.max(0.1, ...days.map((d) => d.kwh)));
	const y = (v: number) => H - (v / max) * (H - TOP);
</script>

<svg viewBox="0 0 {W} {H + 20}" role="img" aria-label="Use each day">
	<line class="grid" x1="0" x2={W} y1={H} y2={H} />
	{#each days as d, i (d.day)}
		{@const mark = marks?.get(d.day)}
		<a href={href(d.day)} aria-label={formatDay(d.day)}>
			<!-- The whole column taps, not just the bar. -->
			<rect class="hit" x={i * step} y="0" width={step} height={H} />
			{#if d.kwh > 0}
				<rect
					class="bar"
					class:on={d.day === selected}
					x={i * step + 1.5}
					y={y(d.kwh)}
					width={step - 3}
					height={H - y(d.kwh)}
					rx="1.5"
				/>
			{/if}
			{#if mark}
				<circle class={mark} cx={i * step + step / 2} cy={y(d.kwh) - 6} r="3" />
			{/if}
		</a>
	{/each}
	<!-- Every week back from the newest day. -->
	{#each days as d, i (d.day)}
		{#if (days.length - 1 - i) % 7 === 0}
			<text x={i * step + step / 2} y={H + 16} text-anchor="middle"
				>{formatDay(d.day).slice(4)}</text
			>
		{/if}
	{/each}
</svg>

<style>
	svg {
		width: 100%;
		display: block;
		overflow: visible;
	}
	.grid {
		stroke: var(--line);
	}
	.hit {
		fill: transparent;
	}
	.bar {
		fill: color-mix(in srgb, var(--accent) 55%, transparent);
	}
	.bar.on {
		fill: var(--accent);
	}
	.high {
		fill: var(--over);
	}
	.low {
		fill: var(--good);
	}
	text {
		font-size: 11px;
		fill: var(--muted);
	}
</style>
