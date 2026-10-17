import { describe, expect, it } from 'vitest';
import { byYear, combined, compare, monthCost, monthlyUse } from './usage.ts';

describe('monthlyUse', () => {
	const history = [
		{ month: '2025-08', kwh: 250 },
		{ month: '2025-09', kwh: 300 }
	];

	it('prefers readings that cover the whole month', () => {
		const meter = [{ month: '2025-09', wh: 310_500, halfHours: 30 * 48 }];
		expect(monthlyUse(meter, history, '2026-10', [])).toEqual([
			{ month: '2025-08', kwh: 250, pence: null, lastYearPricesPence: null, partial: false },
			{ month: '2025-09', kwh: 310.5, pence: null, lastYearPricesPence: null, partial: false }
		]);
	});

	it('keeps the history when readings only cover part of the month', () => {
		const meter = [{ month: '2025-09', wh: 100_000, halfHours: 10 * 48 }];
		expect(monthlyUse(meter, history, '2026-10', [])[1]).toEqual({
			month: '2025-09',
			kwh: 300,
			pence: null,
			lastYearPricesPence: null,
			partial: false
		});
	});

	it('marks this month, and months with only some readings, as partial', () => {
		const meter = [
			{ month: '2026-09', wh: 50_000, halfHours: 5 * 48 },
			{ month: '2026-10', wh: 80_000, halfHours: 16 * 48 }
		];
		expect(monthlyUse(meter, [], '2026-10', []).map((m) => m.partial)).toEqual([true, true]);
	});

	it('allows for the clocks going back', () => {
		const meter = [{ month: '2025-10', wh: 1, halfHours: 31 * 48 - 2 }];
		expect(monthlyUse(meter, [], '2026-10', [])[0].partial).toBe(false);
	});
});

describe('compare', () => {
	const use = monthlyUse(
		[],
		[
			{ month: '2025-01', kwh: 200 },
			{ month: '2025-02', kwh: 100 },
			{ month: '2025-03', kwh: 100 },
			{ month: '2026-01', kwh: 150 },
			{ month: '2026-02', kwh: 90 }
		],
		'2026-03',
		[{ from: '2025-01-01', unitPence: 10, standingPence: 0 }]
	);
	const [y2026, y2025] = byYear(use);

	it('groups by year, newest first', () => {
		expect(y2026.year).toBe(2026);
		expect(y2025.months.slice(0, 4).map((m) => m?.kwh ?? null)).toEqual([200, 100, 100, null]);
	});

	it('compares only the months both years have', () => {
		expect(compare(y2026, y2025, 'kwh')).toEqual({
			value: 240,
			beforeValue: 300,
			change: expect.closeTo(-0.2),
			months: [0, 1],
			why: null
		});
	});

	it('compares pounds', () => {
		expect(compare(y2026, y2025, 'gbp')).toMatchObject({
			value: expect.closeTo(24),
			beforeValue: expect.closeTo(30)
		});
	});

	it('splits a change in pounds into use and prices', () => {
		const prices = [
			{ from: '2025-01-01', unitPence: 10, standingPence: 0 },
			{ from: '2026-01-01', unitPence: 20, standingPence: 0 }
		];
		const history = [
			{ month: '2025-01', kwh: 100 },
			{ month: '2026-01', kwh: 80 }
		];
		const [now, before] = byYear(monthlyUse([], history, '2026-03', prices));
		// £10 last year; 80 kWh would have been £8 (using less: −£2), but cost £16 (prices: +£8).
		const why = compare(now, before, 'gbp')!.why!;
		expect(why.use).toBeCloseTo(-2);
		expect(why.prices).toBeCloseTo(8);
		expect(compare(now, before, 'kwh')!.why).toBeNull();
	});

	it('has nothing to compare without an earlier year', () => {
		expect(compare(y2025, undefined, 'kwh')).toBeNull();
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

describe('combined', () => {
	const month = (m: string, kwh: number, pence: number | null, partial = false) => ({
		month: m,
		kwh,
		pence,
		lastYearPricesPence: pence,
		partial
	});

	it('adds the months both fuels have', () => {
		expect(
			combined(
				[month('2025-01', 300, 9000), month('2025-03', 1, 1)],
				[month('2025-01', 2000, null, true), month('2025-02', 1, 1)]
			)
		).toEqual([month('2025-01', 2300, null, true)]);
	});
});
