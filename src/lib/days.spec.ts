import { describe, expect, it } from 'vitest';
import { addDays } from './dates.ts';
import { unusual, weekSoFar, type DayTotal } from './days.ts';

/** Days from `from`, each at `kwh(i)` and 10p a kWh. */
const days = (from: string, n: number, kwh: (i: number) => number): DayTotal[] =>
	Array.from({ length: n }, (_, i) => ({
		day: addDays(from, i),
		kwh: kwh(i),
		pence: kwh(i) * 10
	}));

describe('unusual', () => {
	it('marks days far from the median, not missing ones', () => {
		const { median, marks } = unusual(days('2026-10-01', 10, (i) => [10, 20, 4, 0][i] ?? 10));
		expect(median).toBe(10);
		expect([...marks]).toEqual([
			['2026-10-02', 'high'],
			['2026-10-03', 'low']
		]);
	});
});

describe('weekSoFar', () => {
	// 2026-10-21 is a Wednesday.
	it('sums Monday to the day, against the same days in earlier weeks', () => {
		const ds = days('2026-09-21', 31, (i) => (i >= 28 ? 12 : 10));
		const w = weekSoFar(ds, '2026-10-21');
		expect(w).toMatchObject({ from: '2026-10-19', kwh: 36, pence: 360, weeks: 4 });
		expect(w.typical).toEqual({ kwh: 30, pence: 300 });
	});

	it('is just the day on a Monday', () => {
		const w = weekSoFar(
			days('2026-10-12', 8, () => 10),
			'2026-10-19'
		);
		expect(w).toMatchObject({ from: '2026-10-19', kwh: 10, typical: { kwh: 10 }, weeks: 1 });
	});

	it('has no typical week when this week has a day missing', () => {
		const ds = days('2026-09-21', 31, (i) => (i === 29 ? 0 : 10));
		expect(weekSoFar(ds, '2026-10-21').typical).toBeNull();
	});

	it('leaves out weeks with a missing day', () => {
		const ds = days('2026-09-21', 31, (i) => (i === 8 ? 0 : 10));
		expect(weekSoFar(ds, '2026-10-21').weeks).toBe(3);
	});
});
