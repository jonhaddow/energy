// UK time: meter readings are UTC half hours; days and months are UK ones.

// Built once: making a formatter costs ~0.1 ms, and Workers' free plan allows
// about 10 ms of CPU per request.
const ukDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/London' }); // YYYY-MM-DD
const shortMonth = new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' });
const dayLabel = new Intl.DateTimeFormat('en-GB', {
	weekday: 'short',
	day: 'numeric',
	month: 'short',
	timeZone: 'UTC'
});
const dateLabel = new Intl.DateTimeFormat('en-GB', { dateStyle: 'medium', timeZone: 'UTC' });

/** The UK date (YYYY-MM-DD) of a unix time in seconds. */
export const dayOf = (unix: number) => ukDay.format(unix * 1000);

/** "Jan" … "Dec" for 1 … 12. */
export const MONTHS = Array.from({ length: 12 }, (_, i) =>
	shortMonth.format(Date.UTC(2000, i, 15))
);

/** "Fri 16 Oct" for 2026-10-16. */
export const formatDay = (day: string) =>
	dayLabel.format(new Date(`${day}T12:00:00Z`)).replace(',', '');

/** "Sep 2026", "Jan–Sep 2026" or "Oct 2025 – Sep 2026" for two YYYY-MMs. */
export function formatMonths(from: string, to: string) {
	const label = (m: string) => MONTHS[Number(m.slice(5, 7)) - 1];
	if (from === to) return `${label(to)} ${to.slice(0, 4)}`;
	if (from.slice(0, 4) === to.slice(0, 4)) return `${label(from)}–${label(to)} ${to.slice(0, 4)}`;
	return `${label(from)} ${from.slice(0, 4)} – ${label(to)} ${to.slice(0, 4)}`;
}

export const daysInMonth = (month: string) =>
	new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();

/** "16 Oct 2026" for 2026-10-16. */
export const formatDate = (day: string) => dateLabel.format(new Date(`${day}T12:00:00Z`));

/** YYYY-MM-DD, a number of days on (or back). */
export const addDays = (day: string, by: number) =>
	new Date(Date.parse(`${day}T00:00:00Z`) + by * 86_400_000).toISOString().slice(0, 10);

/** BST's start and end (unix seconds), by year: 01:00 UTC on the last Sundays of March and October. */
const bstCache = new Map<number, [number, number]>();
function bst(year: number) {
	let range = bstCache.get(year);
	if (!range) {
		const lastSunday = (month: number) => {
			const last = new Date(Date.UTC(year, month + 1, 0));
			return Date.UTC(year, month, last.getUTCDate() - last.getUTCDay(), 1) / 1000;
		};
		range = [lastSunday(2), lastSunday(9)];
		bstCache.set(year, range);
	}
	return range;
}

/**
 * The UK hour (0–23) of a unix time in seconds. Arithmetic rather than Intl:
 * it runs for every half hour of a month, within Workers' CPU limit.
 */
export function ukHour(unix: number) {
	const [start, end] = bst(new Date(unix * 1000).getUTCFullYear());
	const local = unix + (unix >= start && unix < end ? 3600 : 0);
	return Math.floor((local % 86_400) / 3600);
}
