# Energy

Household gas and electricity use, compared year on year, as a phone web app.

- Half-hourly smart meter readings are pulled hourly from Bright (Hildebrand Glow's Glowmarkt API).
- Months from before the meter data can be imported from a CSV.

Stack: SvelteKit (Svelte 5) on Cloudflare Workers, Drizzle ORM on Cloudflare D1, Vitest.

## Running locally

```sh
npm install
npm run db:migrate:local
npx wrangler d1 execute energy --local --command "INSERT INTO user (email, name) VALUES ('you@example.com', 'You')"
cp .dev.vars.example .dev.vars
npm run dev    # the login page has dev-only "Sign in as" buttons
```

Tests: `npm test` (unit), `npm run check` (types), `npm run lint`.

## Importing history

Save monthly totals as `private/history.csv` (columns `fuel,month,kwh,cost_pounds`; `private/` is gitignored), run `npm run db:history`, then `npx wrangler d1 execute energy --local --file=private/history.sql` (`--remote` for live).

## Sign-in

Google OAuth. Only emails in the `user` table can sign in.

## Configuration

Vars in `wrangler.jsonc`: `APP_ORIGIN`, `GOOGLE_CLIENT_ID`.

Secrets (`wrangler secret put`; locally in `.dev.vars`):

- `GOOGLE_CLIENT_SECRET`
- `GLOW_USERNAME` and `GLOW_PASSWORD`: the Bright app login.
- `SYNC_SECRET`: any long random string; authenticates the hourly cron.

## Deploying

Pushing to `main` deploys through Cloudflare Workers Builds, whose deploy command `npm run deploy:ci` applies D1 migrations first. Back up the data with `npx wrangler d1 export energy --remote --output energy.sql` (loads into any SQLite with `sqlite3 energy.db < energy.sql`).
