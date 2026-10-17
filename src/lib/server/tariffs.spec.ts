import { beforeEach, describe, expect, it } from 'vitest';
import { testDb } from './test-db.ts';
import { allTariffs, readTariffForm, removeTariff, saveTariff } from './tariffs.ts';
import type { DB } from './db/index.ts';

const form = (fields: Record<string, string>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(fields)) f.set(k, v);
	return f;
};

describe('readTariffForm', () => {
	const good = { fuel: 'gas', from: '2026-10-01', unit: '6.12', standing: '31.4' };

	it('reads pence', () => {
		expect(readTariffForm(form(good))).toEqual({
			fuel: 'gas',
			from: '2026-10-01',
			unitPence: 6.12,
			standingPence: 31.4
		});
	});

	it('refuses missing or odd values', () => {
		expect(readTariffForm(form({ ...good, unit: '' }))).toBeNull();
		expect(readTariffForm(form({ ...good, standing: '-1' }))).toBeNull();
		expect(readTariffForm(form({ ...good, fuel: 'oil' }))).toBeNull();
		expect(readTariffForm(form({ ...good, from: 'soon' }))).toBeNull();
	});
});

describe('tariffs', () => {
	let db: DB;
	beforeEach(async () => {
		db = await testDb();
	});

	it('saves, replaces prices for the same day and removes', async () => {
		await saveTariff(db, { fuel: 'gas', from: '2026-01-01', unitPence: 6, standingPence: 30 });
		await saveTariff(db, { fuel: 'gas', from: '2026-10-01', unitPence: 7, standingPence: 31 });
		await saveTariff(db, { fuel: 'gas', from: '2026-10-01', unitPence: 6.5, standingPence: 31 });
		expect((await allTariffs(db)).map((t) => [t.from, t.unitPence])).toEqual([
			['2026-10-01', 6.5],
			['2026-01-01', 6]
		]);
		await removeTariff(db, 'gas', '2026-10-01');
		expect(await allTariffs(db)).toHaveLength(1);
	});
});
