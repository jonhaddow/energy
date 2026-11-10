<script lang="ts" module>
	/** A bar: electricity with gas on top (either may be missing), a line for a year before. */
	export type Bar = {
		key: string;
		/** Under the bar; none for most bars when there are many. */
		label?: string;
		electricity: number | null;
		gas: number | null;
		/** A year before, as a line across the bar. */
		lastYear?: number | null;
		/** Not whole yet: drawn paler. */
		partial?: boolean;
		/** The bar taps through to this. */
		href?: string;
		/** For screen readers. */
		name: string;
	};
</script>

<script lang="ts">
	/** Oldest first; `selected` has its label in bold; `onselect` makes bars buttons. */
	let {
		bars,
		label,
		selected,
		onselect
	}: { bars: Bar[]; label: string; selected?: string; onselect?: (key: string) => void } = $props();

	const W = 340;
	const H = 120;
	const TOP = 6;
	const step = $derived(W / bars.length);
	const gap = $derived(Math.max(1.5, step * 0.22));
	const max = $derived(
		Math.max(1, ...bars.map((b) => Math.max((b.electricity ?? 0) + (b.gas ?? 0), b.lastYear ?? 0)))
	);
	const h = (v: number) => (v / max) * (H - TOP);
</script>

<svg viewBox="0 0 {W} {H + 20}" role="img" aria-label={label}>
	<line class="grid" x1="0" x2={W} y1={H} y2={H} />
	{#each bars as b, i (b.key)}
		{@const x = i * step}
		{@const e = h(b.electricity ?? 0)}
		{@const g = h(b.gas ?? 0)}
		{#snippet body()}
			<!-- The whole column taps, not just the bar. -->
			<rect class="hit" {x} y="0" width={step} height={H} />
			<g class:partial={b.partial}>
				{#if e}<rect class="el" x={x + gap / 2} y={H - e} width={step - gap} height={e} />{/if}
				{#if g}<rect class="gas" x={x + gap / 2} y={H - e - g} width={step - gap} height={g} />{/if}
			</g>
			{#if b.lastYear}
				<line
					class="last"
					x1={x + 1}
					x2={x + step - 1}
					y1={H - h(b.lastYear)}
					y2={H - h(b.lastYear)}
				/>
			{/if}
		{/snippet}
		{#if b.href}
			<a href={b.href} aria-label={b.name}>{@render body()}</a>
		{:else if onselect}
			<g
				role="button"
				tabindex="0"
				aria-label={b.name}
				aria-pressed={selected === b.key}
				onclick={() => onselect(b.key)}
				onkeydown={(ev) => (ev.key === 'Enter' || ev.key === ' ') && onselect(b.key)}
			>
				{@render body()}
			</g>
		{:else}
			{@render body()}
		{/if}
		{#if b.label}
			<text x={x + step / 2} y={H + 16} text-anchor="middle" class:on={selected === b.key}
				>{b.label}</text
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
	[role='button'] {
		cursor: pointer;
		outline: none;
	}
	.grid {
		stroke: var(--line);
	}
	.hit {
		fill: transparent;
	}
	.el {
		fill: var(--accent);
	}
	.gas {
		fill: var(--gas);
	}
	.partial {
		opacity: 0.5;
	}
	.last {
		stroke: var(--ink);
		stroke-width: 2;
	}
	text {
		font-size: 11px;
		fill: var(--muted);
	}
	text.on {
		fill: var(--ink);
		font-weight: 700;
	}
</style>
