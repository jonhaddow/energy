// The fuels, shared by the server (the schema) and the pages.
export const FUELS = ['electricity', 'gas'] as const;
export type Fuel = (typeof FUELS)[number];
export type ByFuel<T> = Record<Fuel, T>;

/** Something for each fuel. */
export const byFuel = <T>(fn: (fuel: Fuel) => T) =>
	Object.fromEntries(FUELS.map((f) => [f, fn(f)])) as ByFuel<T>;
