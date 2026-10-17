# Energy

Household gas and electricity use, compared year on year. A PWA at https://energy.app.haddow.me (once deployed). Half-hourly smart meter readings come hourly from Bright (Hildebrand Glow's Glowmarkt API); months before the meter data come from the old Google Sheet ("Energy tracking", filled in from the Loop app). SvelteKit 3 (Svelte 5) on Cloudflare Workers, D1 via Drizzle, the same stack and setup as `~/code/budget` (copy patterns from there). Energy is integer watt hours in `reading`, kWh in `month_history`.

## Where things are

- `src/lib/server/glow.ts`: Glowmarkt API (sign-in, resources, half-hourly readings, max 10 days a request)
- `src/lib/server/sync.ts`: hourly sync: new readings, then backfills history 2 windows per run until a window is empty
- `src/lib/usage.ts`: months (readings win when they cover the whole month, else sheet history), grouping by year, year-on-year comparison
- `src/lib/server/usage.ts`: the SQL behind it
- `src/lib/components/YearChart.svelte`: month-by-month lines, one per year
- `src/routes/+page.svelte`: the only page (`?fuel=gas`); `/sync`: called by the cron (`worker/entry.js`) with `SYNC_SECRET`
- `scripts/history.ts`: sheet CSV (`private/`, not in git) to SQL for `month_history`
- Schema: `src/lib/server/db/schema.ts`

## Commands

Same as budget: `npm test`, `npm run test:e2e`, `npm run check`, `npm run lint`, `scripts/shot.sh <path>`, `scripts/worktree.sh <branch>`. Wrangler: `CLOUDFLARE_API_TOKEN='op://Claude/Cloudflare/credential' op-claude run -- npx wrangler ...`

## Workflow

Same as budget's CLAUDE.md (PRs, bug-hunter and simplifier, `scripts/pr-wait.sh`, merge when Jon says), and its gotchas apply (Workers CPU limit, D1 100 bound values, SvelteKit 3 imports).
