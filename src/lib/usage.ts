// Monthly use, and how each year compares with the one before.
import { daysInMonth } from './dates.ts';

export type MonthUse = {
	/** YYYY-MM */
	month: string;
	kwh: number;
	/** What it cost, standing charges included; null when a day has no price. */
	pence: number | null;
	/** The same use at the prices a year before, so a change splits into use and prices. */
	lastYearPricesPence: number | null;
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
	const add = (month: string, kwh: number, days: number, partial: boolean) => {
		const yearBefore = `${Number(month.slice(0, 4)) - 1}${month.slice(4)}`;
		months.set(month, {
			month,
			kwh,
			pence: monthCost(month, kwh, days, prices),
			// A leap February has a day more than the one before.
			lastYearPricesPence: monthCost(
				yearBefore,
				kwh,
				Math.min(days, daysInMonth(yearBefore)),
				prices
			),
			partial
		});
	};
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

/** Null if either is. */
const plus = (a: number | null, b: number | null) => (a === null || b === null ? null : a + b);

/** Two fuels added together, for the months both have. */
export function combined(a: MonthUse[], b: MonthUse[]): MonthUse[] {
	const other = new Map(b.map((m) => [m.month, m]));
	return a.flatMap((m) => {
		const o = other.get(m.month);
		if (!o) return [];
		return {
			month: m.month,
			kwh: m.kwh + o.kwh,
			pence: plus(m.pence, o.pence),
			lastYearPricesPence: plus(m.lastYearPricesPence, o.lastYearPricesPence),
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

/** YYYY-MM, a number of months on (or back). */
export const addMonths = (month: string, by: number) =>
	new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1 + by, 1))
		.toISOString()
		.slice(0, 7);

/**
 * The last 12 whole months against the same months a year before, so the
 * comparison always spans the seasons and never resets in January. Months
 * without data (or, in £, a price) on both sides are left out. Null when none match.
 */
export function compare(months: MonthUse[], unit: Unit) {
	const byMonth = new Map(months.map((m) => [m.month, m]));
	const latest = months.findLast((m) => !m.partial);
	if (!latest) return null;
	let value = 0;
	let beforeValue = 0;
	/** £ only: this year's use at last year's prices. */
	let atLastYearPrices: number | null = 0;
	const counted: string[] = [];
	for (let back = 11; back >= 0; back--) {
		const month = addMonths(latest.month, -back);
		const m = byMonth.get(month);
		const b = byMonth.get(addMonths(month, -12));
		if (!m || !b || m.partial || b.partial) continue;
		const v = valueOf(m, unit);
		const bv = valueOf(b, unit);
		if (v === null || bv === null) continue;
		value += v;
		beforeValue += bv;
		atLastYearPrices = plus(atLastYearPrices, m.lastYearPricesPence);
		counted.push(month);
	}
	if (!counted.length || !beforeValue) return null;
	return {
		from: counted[0],
		to: counted.at(-1)!,
		value,
		beforeValue,
		change: value / beforeValue - 1,
		/** The months counted (YYYY-MM), each against the same month a year before. */
		months: counted,
		/** In pounds, how much of the change came from using more or less, and how much from prices. */
		why:
			unit === 'gbp' && atLastYearPrices !== null
				? { use: atLastYearPrices / 100 - beforeValue, prices: value - atLastYearPrices / 100 }
				: null
	};
}

/** The fuels' standing charges for a year at the prices on `day`, in pence; null if one has no price. */
export function standingPerYear(fuels: Price[][], day: string) {
	let pence = 0;
	for (const prices of fuels) {
		const p = prices.findLast((p) => p.from <= day);
		if (!p) return null;
		pence += p.standingPence * 365;
	}
	return pence;
}

/** The days new prices start (YYYY-MM-DD), oldest first: each fuel's first prices aren't a change. */
export const priceChanges = (...fuels: Price[][]) =>
	[...new Set(fuels.flatMap((prices) => prices.slice(1).map((p) => p.from)))].sort();

/** A month's heating degree days, and how many days have a temperature. */
export type MonthWeather = { month: string; degreeDays: number; days: number };

/**
 * The headline's gas comparison allowing for the weather: gas per heating
 * degree day against the year before, and how much colder it was. Null
 * without a temperature for every day of those months.
 */
export function weatherAdjusted(months: MonthUse[], weather: MonthWeather[]) {
	const vs = compare(months, 'kwh');
	if (!vs) return null;
	const byMonth = new Map(
		weather.filter((w) => w.days === daysInMonth(w.month)).map((w) => [w.month, w.degreeDays])
	);
	let degreeDays = 0;
	let beforeDegreeDays = 0;
	for (const month of vs.months) {
		const dd = byMonth.get(month);
		const before = byMonth.get(addMonths(month, -12));
		if (dd === undefined || before === undefined) return null;
		degreeDays += dd;
		beforeDegreeDays += before;
	}
	if (!degreeDays || !beforeDegreeDays) return null;
	return {
		change: vs.value / degreeDays / (vs.beforeValue / beforeDegreeDays) - 1,
		colder: degreeDays / beforeDegreeDays - 1
	};
}

/** The last 12 whole months' use; null unless all 12 have data. */
export function lastTwelveMonths(months: MonthUse[]) {
	const latest = months.findLast((m) => !m.partial);
	if (!latest) return null;
	const byMonth = new Map(months.map((m) => [m.month, m]));
	let kwh = 0;
	for (let back = 0; back < 12; back++) {
		const m = byMonth.get(addMonths(latest.month, -back));
		if (!m || m.partial) return null;
		kwh += m.kwh;
	}
	return { from: addMonths(latest.month, -11), to: latest.month, kwh };
}
