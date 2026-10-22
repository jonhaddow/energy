import { describe, expect, it } from 'vitest';
import { dayOf, ukHour } from './dates.ts';
import { dayUse, type HalfHour } from './day.ts';

const at = (iso: string) => Date.parse(iso) / 1000;

describe('ukHour', () => {
	it('follows BST', () => {
		expect(ukHour(at('2026-01-15T18:30:00Z'))).toBe(18);
		expect(ukHour(at('2026-07-15T18:30:00Z'))).toBe(19);
		expect(ukHour(at('2026-07-15T23:30:00Z'))).toBe(0);
		// BST ends at 01:00 UTC on 25 Oct 2026: 00:30 UTC is 01:30 BST, 01:30 UTC is 01:30 GMT.
		expect(ukHour(at('2026-10-25T00:30:00Z'))).toBe(1);
		expect(ukHour(at('2026-10-25T01:30:00Z'))).toBe(1);
		// And starts at 01:00 UTC on 29 Mar 2026.
		expect(ukHour(at('2026-03-29T00:30:00Z'))).toBe(0);
		expect(ukHour(at('2026-03-29T01:00:00Z'))).toBe(2);
	});
});

/** Whole days of half hours from `from` (UTC midnight), each at `wh`. */
function days(from: string, n: number, wh: (i: number) => number): HalfHour[] {
	return Array.from({ length: n * 48 }, (_, i) => {
		const start = at(`${from}T00:00:00Z`) + i * 1800;
		return { start, day: dayOf(start), wh: wh(i) };
	});
}

describe('dayUse', () => {
	it('sums hours and averages the whole days before', () => {
		const rows = [
			...days('2026-01-01', 2, () => 250),
			// A day Bright hasn't filled in: all 0, so not typical.
			...days('2026-01-03', 1, () => 0),
			...days('2026-01-04', 1, (i) => (i === 37 ? 1250 : 250))
		];
		const { hours, typical, typicalDays } = dayUse(rows, '2026-01-04');
		expect(hours[18]).toBeCloseTo(1.5);
		expect(hours[0]).toBeCloseTo(0.5);
		expect(typicalDays).toBe(2);
		expect(typical![18]).toBeCloseTo(0.5);
	});

	it('has no typical day without whole days before', () => {
		expect(
			dayUse(
				days('2026-01-04', 1, () => 250),
				'2026-01-04'
			).typical
		).toBeNull();
	});
});
