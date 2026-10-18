import { describe, expect, it } from 'vitest';
import { daysInMonth } from './dates.ts';
import {
	addMonths,
	byYear,
	combined,
	compare,
	lastTwelveMonths,
	monthCost,
	monthlyUse,
	priceChanges,
	standingPerYear,
	yearCost,
	weatherAdjusted
} from './usage.ts';

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

describe('byYear', () => {
	it('groups by year, newest first', () => {
		const use = monthlyUse(
			[],
			[
				{ month: '2025-01', kwh: 200 },
				{ month: '2026-02', kwh: 90 }
			],
			'2026-03',
			[]
		);
		const [y2026, y2025] = byYear(use);
		expect(y2026.year).toBe(2026);
		expect(y2025.months.slice(0, 2).map((m) => m?.kwh ?? null)).toEqual([200, null]);
	});
});

describe('compare', () => {
	const prices = [{ from: '2024-01-01', unitPence: 10, standingPence: 0 }];
	/** kWh for each month from `start`. */
	const months = (start: string, kwh: number[]) =>
		kwh.map((k, i) => ({ month: addMonths(start, i), kwh: k }));

	it('takes the last 12 whole months, across the new year', () => {
		const history = [
			...months('2024-01', Array(12).fill(100)),
			...months('2025-01', Array(12).fill(90))
		];
		// January 2026 is still going: 2025 against 2024.
		const meter = [{ month: '2026-01', wh: 50_000, halfHours: 5 * 48 }];
		expect(compare(monthlyUse(meter, history, '2026-01', prices), 'kwh')).toEqual({
			from: '2025-01',
			to: '2025-12',
			value: 1080,
			beforeValue: 1200,
			change: expect.closeTo(-0.1),
			months: months('2025-01', Array(12).fill(0)).map((m) => m.month),
			why: null
		});
	});

	it('rolls on a month at a time', () => {
		const history = [...months('2024-01', Array(14).fill(100)), ...months('2025-03', [80, 80])];
		// The 12 months to Apr 2025 only have a year before for Jan–Apr.
		const result = compare(monthlyUse([], history, '2025-05', prices), 'kwh')!;
		expect([result.from, result.to, result.value, result.beforeValue]).toEqual([
			'2025-01',
			'2025-04',
			360,
			400
		]);
	});

	it('compares pounds', () => {
		const history = [...months('2024-01', [100]), ...months('2025-01', [80])];
		expect(compare(monthlyUse([], history, '2025-03', prices), 'gbp')).toMatchObject({
			value: expect.closeTo(8),
			beforeValue: expect.closeTo(10)
		});
	});

	it('splits a change in pounds into use and prices', () => {
		const prices = [
			{ from: '2025-01-01', unitPence: 10, standingPence: 0 },
			{ from: '2026-01-01', unitPence: 20, standingPence: 0 }
		];
		const use = monthlyUse(
			[],
			[...months('2025-01', [100]), ...months('2026-01', [80])],
			'2026-03',
			prices
		);
		// £10 last year; 80 kWh would have been £8 (using less: −£2), but cost £16 (prices: +£8).
		const why = compare(use, 'gbp')!.why!;
		expect(why.use).toBeCloseTo(-2);
		expect(why.prices).toBeCloseTo(8);
		expect(compare(use, 'kwh')!.why).toBeNull();
	});

	it('has nothing to compare without a year before', () => {
		expect(
			compare(monthlyUse([], months('2025-01', [100, 90]), '2025-03', prices), 'kwh')
		).toBeNull();
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

describe('standingPerYear', () => {
	const prices = [
		{ from: '2025-01-01', unitPence: 20, standingPence: 50 },
		{ from: '2025-06-16', unitPence: 30, standingPence: 60 }
	];

	it('is a year of the standing charges in force that day', () => {
		expect(standingPerYear([prices], '2025-06-15')).toBe(50 * 365);
		expect(standingPerYear([prices, prices], '2026-01-01')).toBe(120 * 365);
		expect(standingPerYear([prices], '2024-12-31')).toBeNull();
		expect(standingPerYear([prices, []], '2026-01-01')).toBeNull();
	});
});

describe('priceChanges', () => {
	const price = (from: string) => ({ from, unitPence: 1, standingPence: 1 });

	it('lists the days new prices start, across fuels', () => {
		expect(
			priceChanges(
				[price('2025-01-01'), price('2026-04-01')],
				[price('2024-07-01'), price('2025-01-01'), price('2026-04-01')]
			)
		).toEqual(['2025-01-01', '2026-04-01']);
	});
});

describe('weatherAdjusted', () => {
	const prices = [{ from: '2024-01-01', unitPence: 10, standingPence: 0 }];
	const history = [
		...Array.from({ length: 12 }, (_, i) => ({ month: addMonths('2024-01', i), kwh: 1000 })),
		...Array.from({ length: 12 }, (_, i) => ({ month: addMonths('2025-01', i), kwh: 1100 }))
	];
	const use = monthlyUse([], history, '2026-01', prices);
	/** A year of months from `start`; `missing` days without a temperature. */
	const weather = (start: string, degreeDays: number, missing = 0) =>
		Array.from({ length: 12 }, (_, i) => {
			const month = addMonths(start, i);
			return { month, degreeDays, days: daysInMonth(month) - missing };
		});

	it('compares gas per degree day, so a colder year needs more', () => {
		// 10% more gas in a 20% colder year: 8% less per degree day.
		expect(weatherAdjusted(use, [...weather('2024-01', 100), ...weather('2025-01', 120)])).toEqual({
			change: expect.closeTo(1.1 / 1.2 - 1),
			colder: expect.closeTo(0.2)
		});
	});

	it('needs a temperature for every day', () => {
		expect(
			weatherAdjusted(use, [...weather('2024-01', 100), ...weather('2025-01', 120, 1)])
		).toBeNull();
	});
});

describe('lastTwelveMonths', () => {
	const prices = [{ from: '2024-01-01', unitPence: 10, standingPence: 0 }];
	const history = (n: number) =>
		Array.from({ length: n }, (_, i) => ({ month: addMonths('2025-01', i), kwh: 100 }));

	it('adds up the last 12 whole months', () => {
		const meter = [{ month: '2026-02', wh: 5000, halfHours: 48 }];
		expect(lastTwelveMonths(monthlyUse(meter, history(13), '2026-02', prices))).toEqual({
			from: '2025-02',
			to: '2026-01',
			kwh: 1200
		});
	});

	it('needs all 12', () => {
		expect(lastTwelveMonths(monthlyUse([], history(11), '2026-02', prices))).toBeNull();
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
