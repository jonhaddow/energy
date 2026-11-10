import { describe, expect, it } from 'vitest';
import { daysBetween, home, verdict, type HomeInput } from './home.ts';
import type { MonthUse } from './usage.ts';

// 10p a kWh and 50p a day for electricity, 5p and 30p for gas.
const prices = {
	electricity: [{ from: '2024-01-01', unitPence: 10, standingPence: 50 }],
	gas: [{ from: '2024-01-01', unitPence: 5, standingPence: 30 }]
};
const everyDay = (from: string, to: string, kwh: number) =>
	new Map(daysBetween(from, to).map((d) => [d, kwh]));
const month = (m: string, kwh: number, pence: number, partial = false): MonthUse => ({
	month: m,
	kwh,
	pence,
	partial
});

/** Readings every day from 1 Oct 2025 to 10 Nov 2026: 10 kWh of electricity, 20 of gas. */
const input = (over: Partial<HomeInput> = {}): HomeInput => ({
	lastWhole: '2026-11-10',
	days: {
		electricity: everyDay('2025-10-01', '2026-11-10', 10),
		gas: everyDay('2025-10-01', '2026-11-10', 20)
	},
	gasFrom: '2025-10-01',
	prices,
	months: { electricity: [], gas: [] },
	degreeDays: new Map(),
	...over
});

describe('home', () => {
	it('compares this month so far with the same days a year before', () => {
		const days = everyDay('2025-10-01', '2026-11-10', 10);
		for (const d of daysBetween('2025-11-01', '2025-11-10')) days.set(d, 12);
		const h = home(input({ days: { electricity: days, gas: input().days.gas } }));
		expect(h.month).toBe('2026-11');
		// 10 days of 10 kWh at 10p plus 50p, against 12 kWh.
		expect(h.fuels.electricity).toEqual({
			now: { kwh: 100, pence: 1500 },
			before: { kwh: 120, pence: 1700 }
		});
		expect(h.fuels.gas.now).toEqual({ kwh: 200, pence: 1300 });
	});

	it("uses the month's history a year before when readings don't cover it", () => {
		const h = home(
			input({
				days: {
					electricity: everyDay('2026-10-01', '2026-11-10', 10),
					gas: everyDay('2026-10-01', '2026-11-10', 20)
				},
				gasFrom: '2026-10-01',
				months: { electricity: [month('2025-11', 300, 4500)], gas: [] }
			})
		);
		// A third of November.
		expect(h.fuels.electricity.before).toEqual({ kwh: 100, pence: 1500 });
		expect(h.fuels.gas.before).toBeNull();
	});

	it('has no gas before its first reading', () => {
		const h = home(input({ gasFrom: null }));
		expect(h.fuels.gas.now).toBeNull();
		expect(h.bars[0].gas).toBeNull();
		expect(h.yesterday.pence).toBe(150);
	});

	it('allows for the weather in gas', () => {
		const degreeDays = new Map([
			...daysBetween('2025-11-01', '2025-11-10').map((d) => [d, 10] as const),
			...daysBetween('2026-11-01', '2026-11-10').map((d) => [d, 12.5] as const)
		]);
		const h = home(input({ degreeDays }));
		// The same gas on 25% colder days: 20% less a degree day.
		expect(h.weather!.colder).toBeCloseTo(0.25);
		expect(h.weather!.change).toBeCloseTo(-0.2);
		// Without every day's temperature, nothing.
		degreeDays.delete('2025-11-05');
		expect(home(input({ degreeDays })).weather).toBeNull();
	});

	it('sets yesterday against the median of the 28 days before', () => {
		const days = everyDay('2025-10-01', '2026-11-10', 10);
		days.set('2026-11-10', 30);
		days.set('2026-11-01', 0); // no readings: left out
		const h = home(input({ days: { electricity: days, gas: input().days.gas } }));
		expect(h.yesterday.pence).toBe(350 + 130);
		expect(h.yesterday.usualPence).toBe(150 + 130);
		expect(h.yesterday.fuels.electricity).toEqual({ kwh: 30, pence: 350 });
	});

	it('has 30 bars to the newest whole day', () => {
		const h = home(input());
		expect(h.bars).toHaveLength(30);
		expect(h.bars.at(-1)).toEqual({ day: '2026-11-10', electricity: 150, gas: 130 });
	});

	it('has the 12 months to this one, each against a whole month a year before', () => {
		const h = home(
			input({
				months: {
					electricity: [
						month('2025-10', 300, 4000),
						month('2025-11', 300, 4000),
						month('2026-10', 300, 4500),
						month('2026-11', 100, 1500, true)
					],
					gas: [month('2025-10', 600, 3000), month('2026-10', 600, 3500)]
				}
			})
		);
		expect(h.year).toHaveLength(12);
		expect(h.year[0].month).toBe('2025-12');
		expect(h.year.at(-2)).toEqual({
			month: '2026-10',
			electricity: 4500,
			gas: 3500,
			partial: false,
			lastYear: 7000
		});
		expect(h.year.at(-1)).toMatchObject({
			electricity: 1500,
			gas: null,
			partial: true,
			lastYear: 4000
		});
	});
});

describe('verdict', () => {
	it('is about usual within 15%', () => {
		expect(verdict(110, 100)).toBe('about usual');
		expect(verdict(120, 100)).toBe('more than usual');
		expect(verdict(80, 100)).toBe('less than usual');
	});
});
