import { describe, expect, it } from 'vitest';
import { testDb } from './test-db.ts';
import { allTypical, readTypicalForm, saveTypical } from './typical.ts';

const form = (values: Record<string, string>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(values)) f.set(k, v);
	return f;
};
const both = {
	'electricity-low': '1600',
	'electricity-medium': '2500',
	'electricity-high': '3800',
	'gas-low': '6000',
	'gas-medium': '9500',
	'gas-high': '14000'
};

describe('typical use', () => {
	it('starts with Ofgem’s July 2026 figures, and saves new ones', async () => {
		const db = await testDb();
		expect(await allTypical(db)).toContainEqual({
			fuel: 'gas',
			low: 6000,
			medium: 9500,
			high: 14000
		});
		await saveTypical(db, readTypicalForm(form({ ...both, 'gas-high': '15000' }))!);
		expect((await allTypical(db)).find((t) => t.fuel === 'gas')?.high).toBe(15000);
	});

	it('needs whole kWh, low to high', () => {
		expect(readTypicalForm(form(both))).toHaveLength(2);
		expect(readTypicalForm(form({ ...both, 'gas-low': '10000' }))).toBeNull();
		expect(readTypicalForm(form({ ...both, 'electricity-medium': '2500.5' }))).toBeNull();
		expect(readTypicalForm(form({ ...both, 'gas-high': '' }))).toBeNull();
	});
});
