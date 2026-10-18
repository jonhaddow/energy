import { describe, expect, it } from 'vitest';
import { readQuoteForm } from './quotes.ts';

const form = (fields: Record<string, string>) => {
	const f = new FormData();
	for (const [k, v] of Object.entries(fields)) f.set(k, v);
	return f;
};
const good = {
	name: ' Octopus 12M Fixed ',
	electricityUnit: '24.5',
	electricityStanding: '48.2',
	gasUnit: '5.9',
	gasStanding: '29.6',
	fixedUntil: ''
};

describe('quotes', () => {
	it('reads the form', () => {
		expect(readQuoteForm(form(good))).toEqual({
			name: 'Octopus 12M Fixed',
			electricityUnitPence: 24.5,
			electricityStandingPence: 48.2,
			gasUnitPence: 5.9,
			gasStandingPence: 29.6,
			fixedUntil: null
		});
		expect(readQuoteForm(form({ ...good, fixedUntil: '2027-10-31' }))?.fixedUntil).toBe(
			'2027-10-31'
		);
	});

	it('refuses a missing name or price', () => {
		expect(readQuoteForm(form({ ...good, name: ' ' }))).toBeNull();
		expect(readQuoteForm(form({ ...good, gasUnit: '' }))).toBeNull();
	});
});
