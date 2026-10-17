// The Glowmarkt API behind the Bright app (Hildebrand Glow), which has the
// smart meter's readings from the DCC. Docs: https://docs.glowmarkt.com
import type { Fuel } from './db/schema.ts';

const API = 'https://api.glowmarkt.com/api/v0-1';
/** Bright's application id, from Glowmarkt's docs (public). */
const APPLICATION_ID = 'b0f1b774-a586-4f72-9edd-27ead8aa7a8d';
/** Half-hourly readings come at most 10 days per request. */
export const WINDOW_DAYS = 9;

export class GlowError extends Error {}

type Fetch = typeof fetch;

export async function signIn(username: string, password: string, f: Fetch = fetch) {
	const res = await f(`${API}/auth`, {
		method: 'POST',
		headers: { 'content-type': 'application/json', applicationId: APPLICATION_ID },
		body: JSON.stringify({ username, password })
	});
	const body = (await res.json().catch(() => null)) as { valid?: boolean; token?: string } | null;
	if (!res.ok || !body?.valid || !body.token)
		throw new GlowError(`Bright sign-in failed (${res.status})`);
	return new Glow(body.token, f);
}

export class Glow {
	constructor(
		private token: string,
		private f: Fetch
	) {}

	private async get<T>(path: string): Promise<T> {
		const f = this.f;
		const res = await f(`${API}${path}`, {
			headers: {
				'content-type': 'application/json',
				applicationId: APPLICATION_ID,
				token: this.token
			}
		});
		if (!res.ok) throw new GlowError(`Bright ${path.split('?')[0]} failed (${res.status})`);
		return res.json() as Promise<T>;
	}

	/** The energy (kWh) resource for each fuel the meter has. */
	async resources() {
		const list = await this.get<{ resourceId: string; classifier: string }[]>('/resource');
		const ids: Partial<Record<Fuel, string>> = {};
		for (const r of list) {
			if (r.classifier === 'electricity.consumption') ids.electricity = r.resourceId;
			if (r.classifier === 'gas.consumption') ids.gas = r.resourceId;
		}
		return ids;
	}

	/** Asks Glowmarkt to fetch the latest readings from the DCC (it does so in the background). */
	catchup(resourceId: string) {
		return this.get(`/resource/${resourceId}/catchup`).catch(() => {});
	}

	/** Half-hourly kWh from `from` to `to` (unix seconds, at most 10 days apart). */
	async halfHours(resourceId: string, from: number, to: number) {
		const iso = (t: number) => new Date(t * 1000).toISOString().slice(0, 19);
		const q = `from=${iso(from)}&to=${iso(to)}&period=PT30M&offset=0&function=sum`;
		const body = await this.get<{ data?: [number, number][] }>(
			`/resource/${resourceId}/readings?${q}`
		);
		return body.data ?? [];
	}
}
