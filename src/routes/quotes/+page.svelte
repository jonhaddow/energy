<script lang="ts">
	import { Button } from '#lib/components/ui/button/index.ts';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { formatDate, formatMonths } from '#lib/dates.ts';
	import { formatAmount, formatKwh } from '#lib/format.ts';

	let { data, form }: PageProps = $props();

	const pounds = (pence: number) => formatAmount(pence / 100, 'gbp');
	/** "£120 less" or "£40 more" a year than now. */
	const vsNow = (total: number) => {
		const d = Math.round((total - data.now!.total) / 100);
		return d === 0 ? 'the same' : `${formatAmount(Math.abs(d), 'gbp')} ${d < 0 ? 'less' : 'more'}`;
	};
	const fuels = [
		{ key: 'electricity', label: 'Electricity' },
		{ key: 'gas', label: 'Gas' }
	] as const;
</script>

<svelte:head>
	<title>Quotes · Energy</title>
</svelte:head>

<main class="page wide">
	<header>
		<h1>Quotes</h1>
	</header>

	{#if !data.use}
		<p class="card empty muted">Quotes are priced on a whole year of use, which isn’t in yet.</p>
	{:else}
		<section class="card list">
			<p class="muted small">
				A year at each set of prices, for what we used in {formatMonths(
					data.use.from,
					data.use.to
				)}:
				{formatKwh(data.use.electricity)} of electricity and {formatKwh(data.use.gas)} of gas.
			</p>
			<ul>
				{#if data.now}
					<li class="now">
						<div>
							<strong>What we pay now</strong>
							<span class="muted small"
								>{pounds(data.now.use)} use · {pounds(data.now.standing)} standing</span
							>
						</div>
						<strong class="total">{pounds(data.now.total)}</strong>
					</li>
				{/if}
				{#each data.quotes as q (q.id)}
					{@const cheaper = data.now && q.cost.total < data.now.total}
					<li>
						<div>
							<strong>{q.name}</strong>
							<span class="muted small">
								{[
									`${pounds(q.cost.use)} use`,
									`${pounds(q.cost.standing)} standing`,
									q.fixedUntil && `fixed to ${formatDate(q.fixedUntil)}`
								]
									.filter(Boolean)
									.join(' · ')}
							</span>
							{#if data.now}
								<span class={cheaper ? 'good' : 'over'}>{vsNow(q.cost.total)} a year</span>
							{/if}
						</div>
						<div class="right">
							<strong class="total">{pounds(q.cost.total)}</strong>
							<form method="POST" action="?/remove" use:enhance>
								<input type="hidden" name="id" value={q.id} />
								<button class="remove" aria-label="Remove {q.name}">Remove</button>
							</form>
						</div>
					</li>
				{:else}
					<li class="muted small">No quotes yet: add one below.</li>
				{/each}
			</ul>
		</section>
	{/if}

	<form class="card add" method="POST" action="?/add" use:enhance>
		<h2>Add a quote</h2>
		{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
		<label class="field">
			Name
			<input name="name" placeholder="e.g. Octopus 12M Fixed" maxlength="100" required />
		</label>
		{#each fuels as f (f.key)}
			<fieldset>
				<legend>{f.label}</legend>
				<label class="field">
					Unit rate (p/kWh)
					<input type="number" name="{f.key}Unit" step="any" min="0" inputmode="decimal" required />
				</label>
				<label class="field">
					Standing (p/day)
					<input
						type="number"
						name="{f.key}Standing"
						step="any"
						min="0"
						inputmode="decimal"
						required
					/>
				</label>
			</fieldset>
		{/each}
		<label class="field">
			Fixed until (optional)
			<input type="date" name="fixedUntil" />
		</label>
		<p class="muted small">With VAT, as on the quote.</p>
		<Button>Add</Button>
	</form>
</main>

<style>
	header {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	/* Laptops: the list and the form side by side. */
	@media (min-width: 960px) {
		main {
			display: grid;
			grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
			grid-template-areas:
				'top top'
				'list add';
			align-items: start;
		}
		header {
			grid-area: top;
		}
		.list,
		.empty {
			grid-area: list;
		}
		.add {
			grid-area: add;
		}
	}
	.card {
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	.small {
		font-size: 13px;
	}
	ul {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	li {
		display: flex;
		justify-content: space-between;
		gap: 12px;
		padding: 10px 0;
	}
	li + li {
		border-top: 1px solid var(--line);
	}
	li > div {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.right {
		align-items: flex-end;
	}
	.total {
		font-size: 20px;
	}
	.now .total {
		color: var(--accent);
	}
	.good {
		color: var(--good);
		font-weight: 600;
	}
	.over {
		font-weight: 600;
	}
	.remove {
		background: none;
		border: 0;
		padding: 4px 0;
		color: var(--over);
		font-size: 14px;
		cursor: pointer;
	}
	fieldset {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 8px;
		margin: 0;
		padding: 0;
		border: 0;
	}
	legend {
		margin-bottom: 6px;
		font-weight: 600;
	}
	.add {
		gap: 14px;
	}
</style>
