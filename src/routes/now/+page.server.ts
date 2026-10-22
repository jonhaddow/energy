import { halfHours, readingRange } from '#lib/server/day.ts';
import { allTariffs } from '#lib/server/tariffs.ts';
import { addDays, dayOf, ukHour } from '#lib/dates.ts';
import { dayUse } from '#lib/day.ts';
import type { PageServerLoad } from './$types';

/** The typical day: the whole days in the four weeks before. */
const TYPICAL_DAYS = 28;

export const load: PageServerLoad = async ({ url, locals }) => {
	const fuel = url.searchParams.get('fuel') === 'gas' ? 'gas' : 'electricity';
	const range = await readingRange(locals.db, fuel);
	if (!range.first || !range.last) return { fuel, use: null };
	const first = dayOf(range.first);
	const last = dayOf(range.last);
	// Bright's readings come a day or so late, so the newest day is often only
	// partly in: open on the one before unless it reaches its last hour.
	const lastWhole = ukHour(range.last) === 23 ? last : addDays(last, -1);
	const param = url.searchParams.get('day') ?? '';
	const day =
		/^\d{4}-\d{2}-\d{2}$/.test(param) && param >= first && param <= last ? param : lastWhole;

	const [rows, tariffs] = await Promise.all([
		halfHours(locals.db, fuel, addDays(day, -TYPICAL_DAYS), day),
		allTariffs(locals.db)
	]);
	const use = dayUse(rows, day);
	// Newest first, so the first that's started is the day's.
	const price = tariffs.find((t) => t.fuel === fuel && t.from <= day);
	return {
		fuel,
		use: {
			day,
			today: dayOf(Math.floor(Date.now() / 1000)),
			/** Only partly in: readings up to this UK hour. */
			upTo: day === last && day !== lastWhole ? ukHour(range.last) : null,
			before: day > first ? addDays(day, -1) : null,
			after: day < last ? addDays(day, 1) : null,
			...use,
			pence: price ? use.kwh * price.unitPence + price.standingPence : null,
			standingPence: price?.standingPence ?? null
		}
	};
};
