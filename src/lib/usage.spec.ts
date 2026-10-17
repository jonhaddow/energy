import { describe, expect, it } from 'vitest';
import { byYear, compare, monthlyUse } from './usage.ts';

describe('monthlyUse', () => {
	const history = [
		{ month: '2025-08', kwh: 250 },
		{ month: '2025-09', kwh: 300 }
	];

	it('prefers readings that cover the whole month', () => {
		const meter = [{ month: '2025-09', wh: 310_500, halfHours: 30 * 48 }];
		expect(monthlyUse(meter, history, '2026-10')).toEqual([
			{ month: '2025-08', kwh: 250, partial: false },
			{ month: '2025-09', kwh: 310.5, partial: false }
		]);
	});

	it('keeps the history when readings only cover part of the month', () => {
		const meter = [{ month: '2025-09', wh: 100_000, halfHours: 10 * 48 }];
		expect(monthlyUse(meter, history, '2026-10')[1]).toEqual({
			month: '2025-09',
			kwh: 300,
			partial: false
		});
	});

	it('marks this month, and months with only some readings, as partial', () => {
		const meter = [
			{ month: '2026-09', wh: 50_000, halfHours: 5 * 48 },
			{ month: '2026-10', wh: 80_000, halfHours: 16 * 48 }
		];
		expect(monthlyUse(meter, [], '2026-10').map((m) => m.partial)).toEqual([true, true]);
	});

	it('allows for the clocks going back', () => {
		const meter = [{ month: '2025-10', wh: 1, halfHours: 31 * 48 - 2 }];
		expect(monthlyUse(meter, [], '2026-10')[0].partial).toBe(false);
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
		'2026-03'
	);
	const [y2026, y2025] = byYear(use);

	it('groups by year, newest first', () => {
		expect(y2026.year).toBe(2026);
		expect(y2025.months.slice(0, 4).map((m) => m?.kwh ?? null)).toEqual([200, 100, 100, null]);
	});

	it('compares only the months both years have', () => {
		expect(compare(y2026, y2025)).toEqual({
			kwh: 240,
			beforeKwh: 300,
			change: expect.closeTo(-0.2),
			months: [0, 1]
		});
	});

	it('has nothing to compare without an earlier year', () => {
		expect(compare(y2025, undefined)).toBeNull();
	});
});
