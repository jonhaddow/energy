import { asc, eq } from 'drizzle-orm';
import { quote } from './db/schema.ts';
import { pence } from './tariffs.ts';
import type { DB } from './db/index.ts';

export type Quote = typeof quote.$inferSelect;

export const allQuotes = (db: DB) => db.select().from(quote).orderBy(asc(quote.id));

export const addQuote = (db: DB, q: Omit<Quote, 'id'>) => db.insert(quote).values(q);

export const removeQuote = (db: DB, id: number) => db.delete(quote).where(eq(quote.id, id));

/** The form's fields, or null if the name is missing or a price isn't one. */
export function readQuoteForm(form: FormData): Omit<Quote, 'id'> | null {
	const name = String(form.get('name') ?? '').trim();
	const fixedUntil = String(form.get('fixedUntil') ?? '');
	const prices = {
		electricityUnitPence: pence(form.get('electricityUnit')),
		electricityStandingPence: pence(form.get('electricityStanding')),
		gasUnitPence: pence(form.get('gasUnit')),
		gasStandingPence: pence(form.get('gasStanding'))
	};
	if (!name || name.length > 100) return null;
	if (fixedUntil && !/^\d{4}-\d{2}-\d{2}$/.test(fixedUntil)) return null;
	if (Object.values(prices).some((p) => p === null)) return null;
	return {
		name,
		...(prices as Record<keyof typeof prices, number>),
		fixedUntil: fixedUntil || null
	};
}
