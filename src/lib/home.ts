// The home page: this month so far against a year before, yesterday against a
// usual day, the last 30 days and the last 12 months, in £ for both fuels.
import { addDays, daysInMonth } from './dates.ts';
import { addMonths, type MonthUse, type Price } from './usage.ts';

export const FUELS = ['electricity', 'gas'] as const;
export type Fuel = (typeof FUELS)[number];
type ByFuel<T> = Record<Fuel, T>;

/** A fuel's use and cost over some days. */
export type Use = { kwh: number; pence: number | null };

export type HomeInput = {
	/** The newest whole day of readings (YYYY-MM-DD). */
	lastWhole: string;
	/** kWh each day, from the first of this month a year before to `lastWhole`. */
	days: ByFuel<Map<string, number>>;
	/** The first day with a gas reading, if any. */
	gasFrom: string | null;
	/** Oldest first. */
	prices: ByFuel<Price[]>;
	months: ByFuel<MonthUse[]>;
	/** Heating degree days each day that has a temperature. */
	degreeDays: Map<string, number>;
};

/** Yesterday is "about usual" within this much of the usual day. */
const USUAL = 0.15;

/** YYYY-MM-DD from `from` to `to`. */
export function daysBetween(from: string, to: string) {
	const days = [];
	for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
	return days;
}

/** The same date a year before; null for 29 February. */
function yearBefore(day: string) {
	const d = `${Number(day.slice(0, 4)) - 1}${day.slice(4)}`;
	return Number(d.slice(8)) <= daysInMonth(d.slice(0, 7)) ? d : null;
}

const median = (values: number[]) => {
	const s = values.toSorted((a, b) => a - b);
	return s.length ? s[Math.floor(s.length / 2)] : null;
};

export function home(input: HomeInput) {
	const { lastWhole, days, gasFrom, prices, months, degreeDays } = input;

	// Bright stores a missing reading as 0, so a day has readings when it has
	// some electricity. Gas can really be 0 (away in summer), so it counts from
	// its first reading on, on days with electricity.
	const has = (fuel: Fuel, day: string) =>
		(days.electricity.get(day) ?? 0) > 0 &&
		(fuel === 'electricity' || (!!gasFrom && day >= gasFrom));

	const pence = (fuel: Fuel, day: string, kwh: number) => {
		const p = prices[fuel].findLast((p) => p.from <= day);
		return p ? kwh * p.unitPence + p.standingPence : null;
	};

	/** A fuel's use over some days; null unless every one has readings. */
	function over(fuel: Fuel, ds: string[]): Use | null {
		if (!ds.length || !ds.every((d) => has(fuel, d))) return null;
		let kwh = 0;
		let p: number | null = 0;
		for (const d of ds) {
			const k = days[fuel].get(d) ?? 0;
			kwh += k;
			const dp = pence(fuel, d, k);
			p = p === null || dp === null ? null : p + dp;
		}
		return { kwh, pence: p };
	}

	/** The same days a year before, from the whole month's history when readings don't cover them. */
	function lastYear(fuel: Fuel, month: string, ds: string[]): Use | null {
		const fromReadings = over(
			fuel,
			ds.map(yearBefore).filter((d) => d !== null)
		);
		if (fromReadings) return fromReadings;
		const m = months[fuel].find((m) => m.month === addMonths(month, -12) && !m.partial);
		if (!m) return null;
		const share = ds.length / daysInMonth(month);
		return { kwh: m.kwh * share, pence: m.pence === null ? null : m.pence * share };
	}

	// This month so far: the newest whole day's month, so on the 1st it's last month whole.
	const month = lastWhole.slice(0, 7);
	const soFarDays = daysBetween(`${month}-01`, lastWhole);
	const fuels = Object.fromEntries(
		FUELS.map((f) => [f, { now: over(f, soFarDays), before: lastYear(f, month, soFarDays) }])
	) as ByFuel<{ now: Use | null; before: Use | null }>;

	// Gas allowing for the weather: kWh per heating degree day, against a year before.
	const dd = (ds: (string | null)[]) =>
		ds.every((d) => d !== null && degreeDays.has(d))
			? ds.reduce((s, d) => s + degreeDays.get(d!)!, 0)
			: null;
	const gas = fuels.gas;
	const ddNow = dd(soFarDays);
	const ddBefore = dd(soFarDays.map(yearBefore));
	const weather =
		gas.now && gas.before?.kwh && ddNow && ddBefore
			? {
					change: gas.now.kwh / ddNow / (gas.before.kwh / ddBefore) - 1,
					colder: ddNow / ddBefore - 1
				}
			: null;

	// Yesterday against the median of the 28 days before with the same fuels.
	const inUse = FUELS.filter((f) => has(f, lastWhole));
	const dayTotal = (day: string) => {
		if (!inUse.every((f) => has(f, day))) return null;
		const ps = inUse.map((f) => pence(f, day, days[f].get(day) ?? 0));
		return ps.every((p) => p !== null) ? ps.reduce((a, b) => a + b, 0) : null;
	};
	const yesterday = {
		day: lastWhole,
		fuels: Object.fromEntries(FUELS.map((f) => [f, over(f, [lastWhole])])) as ByFuel<Use | null>,
		pence: dayTotal(lastWhole),
		usualPence: median(
			daysBetween(addDays(lastWhole, -28), addDays(lastWhole, -1))
				.map(dayTotal)
				.filter((p) => p !== null)
		)
	};

	const bars = daysBetween(addDays(lastWhole, -29), lastWhole).map((day) => ({
		day,
		electricity: has('electricity', day)
			? pence('electricity', day, days.electricity.get(day)!)
			: null,
		gas: has('gas', day) ? pence('gas', day, days.gas.get(day) ?? 0) : null
	}));

	// The 12 months to this one, each with the same fuels a year before.
	const monthOf = (fuel: Fuel, m: string) => months[fuel].find((u) => u.month === m);
	const year = Array.from({ length: 12 }, (_, i) => {
		const m = addMonths(month, i - 11);
		const now = Object.fromEntries(FUELS.map((f) => [f, monthOf(f, m)?.pence ?? null])) as ByFuel<
			number | null
		>;
		const shown = FUELS.filter((f) => now[f] !== null);
		const before = shown.map((f) => monthOf(f, addMonths(m, -12)));
		return {
			month: m,
			...now,
			partial: shown.some((f) => monthOf(f, m)!.partial),
			lastYear:
				shown.length && before.every((b) => b && !b.partial && b.pence !== null)
					? before.reduce((s, b) => s + b!.pence!, 0)
					: null
		};
	});

	return { month, upTo: lastWhole, fuels, weather, yesterday, bars, year };
}

export type Home = ReturnType<typeof home>;

/** "about usual", "more than usual" or "less than usual". */
export function verdict(pence: number, usual: number) {
	const c = pence / usual - 1;
	return Math.abs(c) <= USUAL ? 'about usual' : c > 0 ? 'more than usual' : 'less than usual';
}
