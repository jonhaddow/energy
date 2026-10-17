# Energy

Our gas and electricity use, year on year. Smart meter readings come half-hourly from Bright (Hildebrand Glow); older months come from the spreadsheet we used to fill in from the Loop app.

Stack: SvelteKit 3 (Svelte 5) on Cloudflare Workers, Drizzle ORM on Cloudflare D1 (SQLite), Vitest. Set up like the budget app.

## Running locally

```sh
npm install
npm run db:migrate:local
npx wrangler d1 execute energy --local --command "INSERT INTO user (email, name) VALUES ('you@example.com', 'You')"
cp .dev.vars.example .dev.vars
npm run dev    # the login page has dev-only "Sign in as" buttons
```

History from the sheet: export it as `private/history.csv` (`fuel,month,kwh,cost_pounds`), `npm run db:history`, then `npx wrangler d1 execute energy --local --file=private/history.sql` (`--remote` for live).

## Your data

It's all in the D1 database `energy`. A full copy, as SQL you can load into any SQLite: `npx wrangler d1 export energy --remote --output energy.sql`, then `sqlite3 energy.db < energy.sql`.

## Configuration

Vars in `wrangler.jsonc` (`APP_ORIGIN`, `GOOGLE_CLIENT_ID`). Secrets (`wrangler secret put`): `GOOGLE_CLIENT_SECRET`, `GLOW_USERNAME` and `GLOW_PASSWORD` (the Bright app login), `SYNC_SECRET` (any long random string; authenticates the hourly cron). Locally they go in `.dev.vars`.

## Deploying

As budget: pushing to `main` deploys through Cloudflare Workers Builds, whose deploy command `npm run deploy:ci` applies migrations first.
