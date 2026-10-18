<script lang="ts">
	import { formatMonths } from '#lib/dates.ts';
	import { formatKwh } from '#lib/format.ts';

	/** The last 12 months' use against Ofgem's low, medium and high homes. */
	let {
		kwh,
		from,
		to,
		low,
		medium,
		high
	}: { kwh: number; from: string; to: string; low: number; medium: number; high: number } =
		$props();

	const end = $derived(Math.max(high * 1.2, kwh * 1.08));
	const at = (v: number) => `${(v / end) * 100}%`;
	const where = $derived(
		kwh < low
			? 'less than a low-use home'
			: kwh < medium
				? 'between a low-use and a typical home'
				: kwh < high
					? 'between a typical and a high-use home'
					: 'more than a high-use home'
	);
	const levels = $derived([
		{ label: 'Low', kwh: low },
		{ label: 'Typical', kwh: medium },
		{ label: 'High', kwh: high }
	]);
</script>

<p>
	<strong>{formatKwh(kwh)}</strong> a year: {where}.
	<span class="muted small">({formatMonths(from, to)})</span>
</p>
<div class="scale" role="img" aria-label="Against Ofgem’s low, typical and high homes">
	<div class="track"></div>
	<div class="us" style="left: {at(kwh)}"></div>
	{#each levels as l (l.label)}
		<div class="level" style="left: {at(l.kwh)}">
			<span class="tick"></span>
			<span class="label">{l.label}<br />{l.kwh.toLocaleString('en-GB')}</span>
		</div>
	{/each}
</div>

<style>
	.small {
		font-size: 13px;
	}
	.scale {
		position: relative;
		height: 52px;
		margin: 14px 12px 0;
	}
	.track {
		position: absolute;
		top: 6px;
		left: 0;
		right: 0;
		height: 4px;
		border-radius: 2px;
		background: var(--line);
	}
	.us {
		position: absolute;
		top: 0;
		width: 16px;
		height: 16px;
		margin-left: -8px;
		border-radius: 50%;
		background: var(--accent);
		border: 2px solid var(--card);
		z-index: 1;
	}
	.level {
		position: absolute;
		top: 4px;
		display: flex;
		flex-direction: column;
		align-items: center;
		transform: translateX(-50%);
	}
	.tick {
		width: 2px;
		height: 8px;
		background: var(--muted);
	}
	.label {
		margin-top: 4px;
		font-size: 11px;
		line-height: 1.3;
		text-align: center;
		color: var(--muted);
	}
</style>
