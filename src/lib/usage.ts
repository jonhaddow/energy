// Monthly use, and how each year compares with the one before.
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

/** A month's meter total: watt hours and how many half hours it has readings for. */
export type MeterMonth = { month: string; wh: number; halfHours: number };

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
	const add = (month: string, kwh: number, days: number, partial: boolean) =>
		months.set(month, { month, kwh, pence: monthCost(month, kwh, days, prices), partial });
	for (const h of history) add(h.month, h.kwh, daysInMonth(h.month), false);
	for (const m of meter) {
		// Clock changes add or drop two half hours; allow a few more missing.
		const whole = m.month < thisMonth && m.halfHours >= daysInMonth(m.month) * 48 - 6;
		if (whole || !months.has(m.month))
			add(
				m.month,
				m.wh / 1000,
				whole ? daysInMonth(m.month) : Math.max(1, Math.round(m.halfHours / 48)),
				!whole
			);
	}
	return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
}

/** Two fuels added together, for the months both have. */
export function combined(a: MonthUse[], b: MonthUse[]): MonthUse[] {
	const other = new Map(b.map((m) => [m.month, m]));
	return a.flatMap((m) => {
		const o = other.get(m.month);
		if (!o) return [];
		return {
			month: m.month,
			kwh: m.kwh + o.kwh,
			pence: m.pence === null || o.pence === null ? null : m.pence + o.pence,
			partial: m.partial || o.partial
		};
	});
}

export type Unit = 'kwh' | 'gbp';

/** A month in kWh or pounds; null when there's no data, or no price. */
export const valueOf = (m: MonthUse | null, unit: Unit) =>
	!m ? null : unit === 'kwh' ? m.kwh : m.pence === null ? null : m.pence / 100;

export type Year = {
	year: number;
	/** January to December; null where there's no data. */
	months: (MonthUse | null)[];
};

/** The years with any data, newest first. */
export function byYear(months: MonthUse[]): Year[] {
	const years = new Map<number, Year>();
	for (const m of months) {
		const y = Number(m.month.slice(0, 4));
		if (!years.has(y)) years.set(y, { year: y, months: Array(12).fill(null) });
		years.get(y)!.months[Number(m.month.slice(5, 7)) - 1] = m;
	}
	return [...years.values()].sort((a, b) => b.year - a.year);
}

/**
 * A year against the one before, over the whole months both have
 * (so a year in progress compares like for like). Null when none overlap.
 */
export function compare(year: Year, before: Year | undefined, unit: Unit) {
	if (!before) return null;
	let value = 0;
	let beforeValue = 0;
	const months: number[] = [];
	year.months.forEach((m, i) => {
		const b = before.months[i];
		if (!m || !b || m.partial || b.partial) return;
		const v = valueOf(m, unit);
		const bv = valueOf(b, unit);
		if (v === null || bv === null) return;
		value += v;
		beforeValue += bv;
		months.push(i);
	});
	if (!months.length || !beforeValue) return null;
	return { value, beforeValue, change: value / beforeValue - 1, months };
}
