import { and, asc, desc, eq } from 'drizzle-orm';
import { FUELS, tariff, type Fuel } from './db/schema.ts';
import type { DB } from './db/index.ts';

export type Tariff = typeof tariff.$inferSelect;

/** Newest first, per fuel. */
export const allTariffs = (db: DB) =>
	db.select().from(tariff).orderBy(asc(tariff.fuel), desc(tariff.from));

/** A new tariff, or new prices for one starting the same day. */
export const saveTariff = (db: DB, t: Tariff) =>
	db
		.insert(tariff)
		.values(t)
		.onConflictDoUpdate({
			target: [tariff.fuel, tariff.from],
			set: { unitPence: t.unitPence, standingPence: t.standingPence }
		});

export const removeTariff = (db: DB, fuel: Fuel, from: string) =>
	db.delete(tariff).where(and(eq(tariff.fuel, fuel), eq(tariff.from, from)));

export const pence = (value: FormDataEntryValue | null) => {
	const n = Number(value);
	return typeof value === 'string' && value.trim() && Number.isFinite(n) && n >= 0 && n < 1000
		? n
		: null;
};

/** The form's fields, or null if any is missing or not a price. */
export function readTariffForm(form: FormData): Tariff | null {
	const fuel = form.get('fuel') as Fuel;
	const from = form.get('from');
	const unitPence = pence(form.get('unit'));
	const standingPence = pence(form.get('standing'));
	if (!FUELS.includes(fuel) || typeof from !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(from))
		return null;
	if (unitPence === null || standingPence === null) return null;
	return { fuel, from, unitPence, standingPence };
}
