import type { DB } from '#lib/server/db/index.ts';
import type { SessionUser } from '#lib/server/auth.ts';

// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		interface Platform {
			env: Env;
			ctx: ExecutionContext;
			caches: CacheStorage;
			cf?: IncomingRequestCfProperties;
		}

		// interface Error {}
		interface Locals {
			db: DB;
			user: SessionUser | null;
		}
		// interface PageData {}
		// interface PageState {}
	}
}

declare global {
	namespace Cloudflare {
		interface Env {
			/** Google OAuth client (wrangler.jsonc vars; .dev.vars locally). */
			GOOGLE_CLIENT_ID: string;
			/** Worker secret: `wrangler secret put GOOGLE_CLIENT_SECRET`. */
			GOOGLE_CLIENT_SECRET: string;
			/** Worker secrets: the Bright app (Hildebrand Glow) login the sync reads meter data with. */
			GLOW_USERNAME?: string;
			GLOW_PASSWORD?: string;
			/** Authenticates the hourly cron's call to /sync. */
			SYNC_SECRET?: string;
			/** e.g. https://energy.app.haddow.me (used by the hourly sync). */
			APP_ORIGIN?: string;
		}
	}
}

export {};
