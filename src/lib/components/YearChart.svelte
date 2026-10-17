<script lang="ts">
	import { MONTHS } from '#lib/dates.ts';
	import { formatKwh } from '#lib/format.ts';
	import type { Year } from '#lib/usage.ts';

	/** Newest year first; the first three are drawn. */
	let { years, selected }: { years: Year[]; selected: number } = $props();

	const W = 340;
	const H = 150;
	const PAD = 10;
	const shown = $derived(years.slice(0, 3));
	const max = $derived(Math.max(1, ...shown.flatMap((y) => y.months.map((m) => m?.kwh ?? 0))));
	const x = (i: number) => PAD + (i * (W - 2 * PAD)) / 11;
	const y = (v: number) => H - (v / max) * (H - PAD);

	/**
	 * Runs of consecutive whole months, so gaps in the data stay gaps. A month so
	 * far joins on dashed: its low total isn't a drop.
	 */
	function segments(year: Year) {
		const lines: { points: string; partial: boolean }[] = [];
		let run: string[] = [];
		const end = () => {
			if (run.length) lines.push({ points: run.join(' '), partial: false });
			run = [];
		};
		year.months.forEach((m, i) => {
			const point = m && `${x(i)},${y(m.kwh)}`;
			if (!m || !point) return end();
			if (!m.partial) return run.push(point);
			const before = year.months[i - 1];
			if (before && !before.partial)
				lines.push({ points: `${x(i - 1)},${y(before.kwh)} ${point}`, partial: true });
			end();
		});
		end();
		return lines;
	}

	let picked = $state<number | null>(null);
	const month = $derived(picked ?? selected);

	function pick(e: PointerEvent) {
		const box = (e.currentTarget as SVGElement).getBoundingClientRect();
		const at = ((e.clientX - box.left) / box.width) * W;
		picked = Math.max(0, Math.min(11, Math.round(((at - PAD) * 11) / (W - 2 * PAD))));
	}
</script>

<figure>
	<figcaption>
		<span class="muted">{MONTHS[month]}</span>
		<ul class="legend">
			{#each shown as yr, i (yr.year)}
				{@const m = yr.months[month]}
				<li style="--c: var(--y{i})">
					<span class="key" aria-hidden="true"></span>
					{yr.year}
					<strong>{m ? formatKwh(m.kwh) : '–'}</strong>{#if m?.partial}<span class="muted">
							so far</span
						>{/if}
				</li>
			{/each}
		</ul>
	</figcaption>
	<svg
		viewBox="0 0 {W} {H + 20}"
		role="img"
		aria-label="Use each month, by year (the table below has the numbers)"
		onpointermove={pick}
		onpointerdown={pick}
		onpointerleave={() => (picked = null)}
	>
		<line class="grid" x1="0" x2={W} y1={H} y2={H} />
		<line class="cross" x1={x(month)} x2={x(month)} y1="0" y2={H} />
		<!-- Oldest first, so this year is drawn on top. -->
		{#each shown.toReversed() as yr, r (yr.year)}
			{@const i = shown.length - 1 - r}
			{#each segments(yr) as line (line.points)}
				<polyline
					class="line"
					class:now={i === 0}
					class:partial={line.partial}
					points={line.points}
					style="--c: var(--y{i})"
				/>
			{/each}
			{@const m = yr.months[month]}
			{#if m}
				<circle
					class="dot"
					class:partial={m.partial}
					cx={x(month)}
					cy={y(m.kwh)}
					r="4.5"
					style="--c: var(--y{i})"
				/>
			{/if}
		{/each}
		{#each MONTHS as label, i (label)}
			{#if i % 2 === 0}<text x={x(i)} y={H + 16} text-anchor="middle">{label}</text>{/if}
		{/each}
	</svg>
</figure>

<style>
	figure {
		margin: 0;
		/* Fixed per year's place: this year in amber, earlier years fading back. */
		--y0: var(--accent);
		--y1: light-dark(#57534e, #b5afa5);
		--y2: light-dark(#b8b0a3, #5e5850);
	}
	figcaption {
		display: flex;
		flex-direction: column;
		gap: 6px;
		font-size: 14px;
		margin-bottom: 12px;
	}
	.legend {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 4px 16px;
	}
	.legend li {
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.key {
		width: 14px;
		height: 3px;
		border-radius: 2px;
		background: var(--c);
	}
	svg {
		width: 100%;
		display: block;
		touch-action: pan-y;
		overflow: visible;
	}
	.grid {
		stroke: var(--line);
	}
	.cross {
		stroke: var(--field);
		stroke-dasharray: 3 3;
	}
	.line {
		fill: none;
		stroke: var(--c);
		stroke-width: 2;
		stroke-linejoin: round;
		stroke-linecap: round;
	}
	.line.now {
		stroke-width: 2.5;
	}
	.line.partial {
		stroke-dasharray: 4 5;
	}
	.dot {
		fill: var(--c);
		stroke: var(--card);
		stroke-width: 2;
	}
	/* A month so far: hollow. */
	.dot.partial {
		fill: var(--card);
		stroke: var(--c);
	}
	text {
		font-size: 11px;
		fill: var(--muted);
	}
</style>
