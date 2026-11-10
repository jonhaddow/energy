// Monthly use and cost, and a year's bill at some prices.
import { daysInMonth } from './dates.ts';

export type MonthUse = {
	/** YYYY-MM */
	month: string;
	kwh: number;
	/** What it cost, standing charges included; null when a day has no price. */
	pence: number | null;
	/** Not a whole month: the current one so far, or one the meter data only partly covers. */
	partial: boolean;
};

/** A month's meter total: watt hours, and how many days have a real (non-zero) reading. */
export type MeterMonth = { month: string; wh: number; days: number };

/** Prices from a date (YYYY-MM-DD) until the next one, in pence with VAT. */
export type Price = { from: string; unitPence: number; standingPence: number };

/**
 * A month's cost: its use spread evenly over its days, each day at that day's
 * unit rate, plus each day's standing charge. Null when a day has no price.
 */
export function monthCost(month: string, kwh: number, days: number, prices: Price[]) {
	let pence = 0;
	for (let d = 1; d <= days; d++) {
		const day = `${month}-${String(d).padStart(2, '0')}`;
		const p = prices.findLast((p) => p.from <= day);
		if (!p) return null;
		pence += (kwh / days) * p.unitPence + p.standingPence;
	}
	return pence;
}

/**
 * Each month's use: the meter's readings when they cover the whole month,
 * else the typed-in history, else whatever readings there are (partial).
 */
export function monthlyUse(
	meter: MeterMonth[],
	history: { month: string; kwh: number }[],
	thisMonth: string,
	/** Oldest first. */
	prices: Price[]
): MonthUse[] {
	const months = new Map<string, MonthUse>();
	const add = (month: string, kwh: number, days: number, partial: boolean) => {
		months.set(month, { month, kwh, pence: monthCost(month, kwh, days, prices), partial });
	};
	for (const h of history) add(h.month, h.kwh, daysInMonth(h.month), false);
	for (const m of meter) {
		if (!m.days) continue;
		const whole = m.month < thisMonth && m.days === daysInMonth(m.month);
		if (whole || !months.has(m.month)) add(m.month, m.wh / 1000, m.days, !whole);
	}
	return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** YYYY-MM, a number of months on (or back). */
export const addMonths = (month: string, by: number) =>
	new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + by, 1))
		.toISOString()
		.slice(0, 7);

/** The newest whole month (YYYY-MM), if any. */
export const latestWhole = (months: MonthUse[]) => months.findLast((m) => !m.partial)?.month;

/** The 12 months' use to `to` (YYYY-MM); null unless all 12 are whole. */
export function twelveMonthsTo(months: MonthUse[], to: string) {
	const byMonth = new Map(months.map((m) => [m.month, m]));
	let kwh = 0;
	for (let back = 0; back < 12; back++) {
		const m = byMonth.get(addMonths(to, -back));
		if (!m || m.partial) return null;
		kwh += m.kwh;
	}
	return kwh;
}

/** Unit rate and standing charge for each fuel, in pence with VAT. */
export type Rates = Record<'electricity' | 'gas', { unitPence: number; standingPence: number }>;

/** A year's bill at some prices for our use (kWh a year each fuel), in pence: use and standing charges. */
export function yearCost(kwh: Record<'electricity' | 'gas', number>, rates: Rates) {
	const fuels = ['electricity', 'gas'] as const;
	const use = fuels.reduce((p, f) => p + kwh[f] * rates[f].unitPence, 0);
	const standing = fuels.reduce((p, f) => p + 365 * rates[f].standingPence, 0);
	return { use, standing, total: use + standing };
}
