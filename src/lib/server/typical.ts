import { sql } from 'drizzle-orm';
import { FUELS, typicalUse, type Fuel } from './db/schema.ts';
import type { DB } from './db/index.ts';

export type Typical = typeof typicalUse.$inferSelect;

export const allTypical = (db: DB) => db.select().from(typicalUse);

export const saveTypical = (db: DB, rows: Typical[]) =>
	db
		.insert(typicalUse)
		.values(rows)
		.onConflictDoUpdate({
			target: typicalUse.fuel,
			set: {
				low: sql`excluded.low`,
				medium: sql`excluded.medium`,
				high: sql`excluded.high`
			}
		});

const LEVELS = ['low', 'medium', 'high'] as const;

/** Both fuels' low, medium and high from the form (`electricity-low` …), or null if any isn't a whole kWh rising. */
export function readTypicalForm(form: FormData): Typical[] | null {
	const rows = FUELS.map((fuel: Fuel) => {
		const [low, medium, high] = LEVELS.map((l) => {
			// A blank or missing field is 0, so fails too.
			const n = Number(form.get(`${fuel}-${l}`));
			return Number.isInteger(n) && n > 0 ? n : null;
		});
		return low && medium && high && low < medium && medium < high
			? { fuel, low, medium, high }
			: null;
	});
	return rows.every((r) => r !== null) ? rows : null;
}
