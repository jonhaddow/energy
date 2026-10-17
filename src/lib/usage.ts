// Monthly use, and how each year compares with the one before.
import { daysInMonth } from './dates.ts';

export type MonthUse = {
	/** YYYY-MM */
	month: string;
	kwh: number;
	/** Not a whole month: the current one so far, or one the meter data only partly covers. */
	partial: boolean;
};

/** A month's meter total: watt hours and how many half hours it has readings for. */
export type MeterMonth = { month: string; wh: number; halfHours: number };

/**
 * Each month's use: the meter's readings when they cover the whole month,
 * else the typed-in history, else whatever readings there are (partial).
 */
export function monthlyUse(
	meter: MeterMonth[],
	history: { month: string; kwh: number }[],
	thisMonth: string
): MonthUse[] {
	const months = new Map<string, MonthUse>();
	for (const h of history) months.set(h.month, { month: h.month, kwh: h.kwh, partial: false });
	for (const m of meter) {
		// Clock changes add or drop two half hours; allow a few more missing.
		const whole = m.month < thisMonth && m.halfHours >= daysInMonth(m.month) * 48 - 6;
		if (whole || !months.has(m.month))
			months.set(m.month, { month: m.month, kwh: m.wh / 1000, partial: !whole });
	}
	return [...months.values()].sort((a, b) => a.month.localeCompare(b.month));
}

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
export function compare(year: Year, before: Year | undefined) {
	if (!before) return null;
	let kwh = 0;
	let beforeKwh = 0;
	const months: number[] = [];
	year.months.forEach((m, i) => {
		const b = before.months[i];
		if (!m || !b || m.partial || b.partial) return;
		kwh += m.kwh;
		beforeKwh += b.kwh;
		months.push(i);
	});
	if (!months.length || !beforeKwh) return null;
	return { kwh, beforeKwh, change: kwh / beforeKwh - 1, months };
}
