import { index, integer, primaryKey, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const FUELS = ['electricity', 'gas'] as const;
export type Fuel = (typeof FUELS)[number];

/** People who can sign in (Google accounts). */
export const user = sqliteTable('user', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	name: text('name').notNull()
});

export type User = typeof user.$inferSelect;

/** Signed-in sessions. The id is the SHA-256 of the cookie's token, never the token itself. */
export const session = sqliteTable(
	'session',
	{
		id: text('id').primaryKey(),
		userId: integer('user_id')
			.notNull()
			.references(() => user.id, { onDelete: 'cascade' }),
		expiresAt: text('expires_at').notNull()
	},
	(t) => [index('session_user_idx').on(t.userId)]
);

/**
 * Half-hourly meter readings from Bright (Hildebrand Glow), which reads the
 * smart meter through the DCC. `start` is the half hour's start (unix seconds),
 * `day` its date in UK time, so days and months group without time zone maths.
 */
export const reading = sqliteTable(
	'reading',
	{
		fuel: text('fuel', { enum: FUELS }).notNull(),
		start: integer('start').notNull(),
		day: text('day').notNull(),
		/** Watt hours (integer, like pence in the budget app). */
		wh: integer('wh').notNull()
	},
	(t) => [primaryKey({ columns: [t.fuel, t.start] }), index('reading_day_idx').on(t.fuel, t.day)]
);

/**
 * Monthly totals from before the meter data starts: the old Google Sheet,
 * typed in from the Loop app. Readings win for any month they fully cover.
 */
export const monthHistory = sqliteTable(
	'month_history',
	{
		fuel: text('fuel', { enum: FUELS }).notNull(),
		/** YYYY-MM */
		month: text('month').notNull(),
		kwh: real('kwh').notNull(),
		/** What the month cost, standing charge included, if known. */
		costPence: integer('cost_pence')
	},
	(t) => [primaryKey({ columns: [t.fuel, t.month] })]
);

/** How the hourly sync went (one row). */
export const syncStatus = sqliteTable('sync_status', {
	id: integer('id').primaryKey(),
	lastRunAt: text('last_run_at').notNull(),
	/** Null when the last run worked. */
	lastError: text('last_error')
});

/** Per fuel: when the sync finished pulling the meter's history (it works back 18 days a run). */
export const backfill = sqliteTable('backfill', {
	fuel: text('fuel', { enum: FUELS }).primaryKey(),
	doneAt: text('done_at').notNull()
});

/**
 * Energy prices for a fuel from a date until the next tariff starts.
 * Pence with VAT, as on the bill: rates have fractions of a penny.
 */
export const tariff = sqliteTable(
	'tariff',
	{
		fuel: text('fuel', { enum: FUELS }).notNull(),
		/** YYYY-MM-DD, the first day the prices apply. */
		from: text('from').notNull(),
		unitPence: real('unit_pence').notNull(),
		/** Per day. */
		standingPence: real('standing_pence').notNull()
	},
	(t) => [primaryKey({ columns: [t.fuel, t.from] })]
);

/** Where the house is (one row), for the weather. Set in Settings. */
export const location = sqliteTable('location', {
	id: integer('id').primaryKey(),
	/** As found by Open-Meteo's geocoding, e.g. "Swansea, Wales". */
	name: text('name').notNull(),
	latitude: real('latitude').notNull(),
	longitude: real('longitude').notNull()
});

/** Each UK day's mean temperature at the location (Open-Meteo), for heating degree days. */
export const weatherDay = sqliteTable('weather_day', {
	/** YYYY-MM-DD */
	day: text('day').primaryKey(),
	meanC: real('mean_c').notNull()
});

/**
 * Ofgem's typical household use a year (TDCVs), low, medium and high, in kWh.
 * Seeded with the July 2026 figures; editable in Settings when Ofgem revises them.
 */
export const typicalUse = sqliteTable('typical_use', {
	fuel: text('fuel', { enum: FUELS }).primaryKey(),
	low: integer('low').notNull(),
	medium: integer('medium').notNull(),
	high: integer('high').notNull()
});
