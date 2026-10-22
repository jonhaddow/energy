<script lang="ts">
	import { formatSmallKwh } from '#lib/format.ts';

	/** kWh in each hour (0–23); `typical` drawn as a line behind; `upTo`: the last hour with readings. */
	let { hours, typical, upTo }: { hours: number[]; typical: number[] | null; upTo: number | null } =
		$props();

	const W = 340;
	const H = 150;
	const PAD = 4;
	const step = (W - 2 * PAD) / 24;
	const shown = $derived(hours.slice(0, (upTo ?? 23) + 1));
	const max = $derived(Math.max(0.1, ...shown, ...(typical ?? [])));
	const y = (v: number) => H - (v / max) * (H - PAD);
	/** The typical day as steps, one flat run per hour. */
	const typicalPath = $derived(
		typical
			?.map((v, h) => `${h ? 'L' : 'M'}${PAD + h * step} ${y(v)}H${PAD + (h + 1) * step}`)
			.join('')
	);

	/** The busiest hour, until another's picked. */
	const peak = $derived(shown.indexOf(Math.max(...shown)));
	let picked = $state<number | null>(null);
	const hour = $derived(picked ?? peak);
	const label = (h: number) => `${String(h).padStart(2, '0')}:00`;

	function pick(e: PointerEvent) {
		const box = (e.currentTarget as SVGElement).getBoundingClientRect();
		const at = ((e.clientX - box.left) / box.width) * W;
		picked = Math.max(0, Math.min(shown.length - 1, Math.floor((at - PAD) / step)));
	}
</script>

<figure>
	<figcaption>
		<span class="muted">{label(hour)}–{label((hour + 1) % 24)}</span>
		<strong>{formatSmallKwh(hours[hour])}</strong>
		{#if typical}<span class="muted">typical {formatSmallKwh(typical[hour])}</span>{/if}
	</figcaption>
	<svg
		viewBox="0 0 {W} {H + 20}"
		role="img"
		aria-label="Use each hour"
		onpointermove={pick}
		onpointerdown={pick}
		onpointerleave={() => (picked = null)}
	>
		<line class="grid" x1="0" x2={W} y1={H} y2={H} />
		{#each shown as v, h (h)}
			<rect
				class:on={h === hour}
				x={PAD + h * step + 1.5}
				y={y(v)}
				width={step - 3}
				height={H - y(v)}
				rx="1.5"
			/>
		{/each}
		{#if typicalPath}<path class="typical" d={typicalPath} />{/if}
		{#each [0, 6, 12, 18] as h (h)}
			<text x={PAD + h * step} y={H + 16}>{label(h)}</text>
		{/each}
	</svg>
	{#if typical}
		<p class="key muted"><span aria-hidden="true"></span> Typical day</p>
	{/if}
</figure>

<style>
	figure {
		margin: 0;
		user-select: none;
		-webkit-user-select: none;
		-webkit-touch-callout: none;
	}
	figcaption {
		display: flex;
		gap: 10px;
		align-items: baseline;
		font-size: 14px;
		margin-bottom: 12px;
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
	rect {
		fill: color-mix(in srgb, var(--accent) 55%, transparent);
	}
	rect.on {
		fill: var(--accent);
	}
	.typical {
		fill: none;
		stroke: var(--ink);
		stroke-width: 1.5;
		stroke-dasharray: 3 3;
	}
	text {
		font-size: 11px;
		fill: var(--muted);
	}
	.key {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 8px;
		font-size: 13px;
	}
	.key span {
		width: 14px;
		border-top: 1.5px dashed var(--ink);
	}
</style>
