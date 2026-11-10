import { describe, expect, it } from 'vitest';
import {
	addMonths,
	latestWhole,
	monthCost,
	monthlyUse,
	twelveMonthsTo,
	yearCost
} from './usage.ts';

describe('monthlyUse', () => {
	const history = [
		{ month: '2025-08', kwh: 250 },
		{ month: '2025-09', kwh: 300 }
	];

	it('prefers readings that cover the whole month', () => {
		const meter = [{ month: '2025-09', wh: 310_500, days: 30 }];
		expect(monthlyUse(meter, history, '2026-10', [])).toEqual([
			{ month: '2025-08', kwh: 250, pence: null, partial: false },
			{ month: '2025-09', kwh: 310.5, pence: null, partial: false }
		]);
	});

	it('keeps the history when readings only cover part of the month', () => {
		const meter = [{ month: '2025-09', wh: 100_000, days: 10 }];
		expect(monthlyUse(meter, history, '2026-10', [])[1]).toEqual({
			month: '2025-09',
			kwh: 300,
			pence: null,
			partial: false
		});
	});

	it('marks this month, and months with only some readings, as partial', () => {
		const meter = [
			{ month: '2026-09', wh: 50_000, days: 5 },
			{ month: '2026-10', wh: 80_000, days: 16 }
		];
		expect(monthlyUse(meter, [], '2026-10', []).map((m) => m.partial)).toEqual([true, true]);
	});

	it("isn't whole with a day Bright has nothing for", () => {
		const meter = [{ month: '2025-09', wh: 300_000, days: 29 }];
		expect(monthlyUse(meter, history, '2026-10', [])[1].kwh).toBe(300);
	});

	it('leaves out months with no real readings', () => {
		expect(monthlyUse([{ month: '2025-05', wh: 0, days: 0 }], [], '2026-10', [])).toEqual([]);
	});
});

describe('monthCost', () => {
	const prices = [
		{ from: '2025-01-01', unitPence: 20, standingPence: 50 },
		{ from: '2025-06-16', unitPence: 30, standingPence: 60 }
	];

	it('adds use at the unit rate and a standing charge a day', () => {
		expect(monthCost('2025-02', 280, 28, prices)).toBeCloseTo(280 * 20 + 28 * 50);
	});

	it('splits a month the prices change in by day', () => {
		// 15 days at the old prices, 15 at the new; 10 kWh a day.
		expect(monthCost('2025-06', 300, 30, prices)).toBeCloseTo(15 * (200 + 50) + 15 * (300 + 60));
	});

	it('has no cost before the first price', () => {
		expect(monthCost('2024-12', 100, 31, prices)).toBeNull();
	});
});

describe('twelveMonthsTo', () => {
	const prices = [{ from: '2024-01-01', unitPence: 10, standingPence: 0 }];
	const history = (n: number) =>
		Array.from({ length: n }, (_, i) => ({ month: addMonths('2025-01', i), kwh: 100 }));

	it('adds up the 12 months to a month, if all are whole', () => {
		const meter = [{ month: '2026-02', wh: 5000, days: 1 }];
		const use = monthlyUse(meter, history(13), '2026-02', prices);
		expect(latestWhole(use)).toBe('2026-01');
		expect(twelveMonthsTo(use, '2026-01')).toBe(1200);
		expect(twelveMonthsTo(use, '2026-02')).toBeNull();
		expect(twelveMonthsTo(monthlyUse([], history(11), '2026-02', prices), '2025-11')).toBeNull();
	});
});

describe('yearCost', () => {
	it('prices a year of use, with a year of standing charges', () => {
		const rates = {
			electricity: { unitPence: 25, standingPence: 50 },
			gas: { unitPence: 6, standingPence: 30 }
		};
		expect(yearCost({ electricity: 2000, gas: 10000 }, rates)).toEqual({
			use: 2000 * 25 + 10000 * 6,
			standing: 365 * 80,
			total: 2000 * 25 + 10000 * 6 + 365 * 80
		});
	});
});
