<script lang="ts">
	import { enhance } from '$app/forms';
	import { formatDate } from '#lib/dates.ts';

	let { data, form } = $props();

	const fuels = [
		{ value: 'electricity', label: 'Electricity' },
		{ value: 'gas', label: 'Gas' }
	] as const;

	const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/London' });
	const pence = (p: number) => `${p.toLocaleString('en-GB', { maximumFractionDigits: 3 })}p`;
</script>

<svelte:head>
	<title>Settings · Energy</title>
</svelte:head>

<main class="page wide">
	<header>
		<a class="back" href="/">‹ Back</a>
		<h1>Settings</h1>
	</header>

	<section class="card prices">
		<h2>Prices</h2>
		<p class="muted small">With VAT, as on the bill.</p>

		{#each fuels as f (f.value)}
			{@const rows = data.tariffs.filter((t) => t.fuel === f.value)}
			<h3>{f.label}</h3>
			{#if rows.length}
				<ul class="tariffs">
					{#each rows as t (t.from)}
						<li>
							<div>
								<span class="muted small">From {formatDate(t.from)}</span>
								<span>{pence(t.unitPence)}/kWh · {pence(t.standingPence)}/day</span>
							</div>
							<form method="POST" action="?/remove" use:enhance>
								<input type="hidden" name="fuel" value={t.fuel} />
								<input type="hidden" name="from" value={t.from} />
								<button class="remove" aria-label="Remove {f.label} from {formatDate(t.from)}">
									Remove
								</button>
							</form>
						</li>
					{/each}
				</ul>
			{:else}
				<p class="muted small">None yet.</p>
			{/if}
		{/each}
	</section>

	<form class="card add" method="POST" action="?/save" use:enhance>
		<h2>New prices</h2>
		{#if form?.error}<p class="error" role="alert">{form.error}</p>{/if}
		<div class="segments" role="radiogroup" aria-label="Fuel">
			{#each fuels as f (f.value)}
				<label>
					<input type="radio" name="fuel" value={f.value} checked={f.value === 'electricity'} />
					<span>{f.label}</span>
				</label>
			{/each}
		</div>
		<label class="field">
			From
			<input type="date" name="from" value={today} required />
		</label>
		<label class="field">
			Unit rate (p/kWh)
			<input type="number" name="unit" step="any" min="0" inputmode="decimal" required />
		</label>
		<label class="field">
			Standing charge (p/day)
			<input type="number" name="standing" step="any" min="0" inputmode="decimal" required />
		</label>
		<p class="muted small">The same fuel and date again replaces those prices.</p>
		<button class="btn primary">Save</button>
	</form>

	<form class="card place" method="POST" action="?/location" use:enhance>
		<h2>Location</h2>
		<p class="muted small">
			For the weather, so gas use can allow for a colder or warmer year.
			{#if data.location}Now: {data.location.name}.{/if}
		</p>
		{#if form?.placeError}<p class="error" role="alert">{form.placeError}</p>{/if}
		<label class="field">
			Town
			<input name="place" value={data.location?.name.split(',')[0] ?? ''} required />
		</label>
		<button class="btn">Save location</button>
	</form>

	<form class="card homes" method="POST" action="?/typical" use:enhance>
		<h2>Other homes</h2>
		<p class="muted small">
			Ofgem’s yearly use for low, typical and high UK homes (kWh), to compare with ours. These are
			its figures from July 2026.
		</p>
		{#if form?.typicalError}<p class="error" role="alert">{form.typicalError}</p>{/if}
		{#each fuels as f (f.value)}
			{@const t = data.typical.find((t) => t.fuel === f.value)}
			<fieldset>
				<legend>{f.label}</legend>
				{#each [['low', 'Low'], ['medium', 'Typical'], ['high', 'High']] as const as [key, label] (key)}
					<label class="field">
						{label}
						<input
							type="number"
							name="{f.value}-{key}"
							value={t?.[key]}
							min="1"
							step="1"
							inputmode="numeric"
							required
						/>
					</label>
				{/each}
			</fieldset>
		{/each}
		<button class="btn">Save figures</button>
	</form>

	<form class="out" method="POST" action="/logout">
		<button class="signout">Sign out</button>
	</form>
</main>

<style>
	header {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}
	/* Laptops: two columns, filled in order (prices and the form on the left). */
	@media (min-width: 960px) {
		main {
			display: block;
			columns: 2;
			column-gap: 32px;
		}
		header {
			column-span: all;
			margin-bottom: 20px;
		}
		main > :not(header) {
			break-inside: avoid;
			margin-bottom: 20px;
		}
	}
	.card {
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}
	h3 {
		margin: 8px 0 0;
		font-size: 16px;
	}
	.small {
		font-size: 13px;
	}
	.tariffs {
		list-style: none;
		margin: 0;
		padding: 0;
	}
	.tariffs li {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding: 6px 0;
	}
	.tariffs li + li {
		border-top: 1px solid var(--line);
	}
	.tariffs div {
		display: flex;
		flex-direction: column;
	}
	.remove {
		background: none;
		border: 0;
		padding: 8px;
		color: var(--over);
		font-size: 14px;
		cursor: pointer;
	}
	.add {
		gap: 14px;
	}
	fieldset {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 8px;
		margin: 0;
		padding: 0;
		border: 0;
	}
	legend {
		margin-bottom: 6px;
		font-weight: 600;
	}
	.signout {
		width: 100%;
		min-height: 52px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--over);
		font-weight: 600;
		font-size: 16px;
		cursor: pointer;
	}
</style>
