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

/** The UK date (YYYY-MM-DD) of a unix time in seconds. */
export const dayOf = (unix: number) => ukDay.format(unix * 1000);

/** "Jan" … "Dec" for 1 … 12. */
export const MONTHS = Array.from({ length: 12 }, (_, i) =>
	shortMonth.format(Date.UTC(2000, i, 15))
);

/** "Fri 16 Oct" for 2026-10-16. */
export const formatDay = (day: string) =>
	dayLabel.format(new Date(`${day}T12:00:00Z`)).replace(',', '');

export const daysInMonth = (month: string) =>
	new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
