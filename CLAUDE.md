# Energy

Household gas and electricity use, compared year on year. A PWA at https://energy.app.haddow.me. Half-hourly smart meter readings come hourly from Bright (Hildebrand Glow's Glowmarkt API); months before the meter data come from the old Google Sheet ("Energy tracking", filled in from the Loop app). SvelteKit 3 (Svelte 5) on Cloudflare Workers, D1 via Drizzle, the same stack and setup as `~/code/budget` (copy code patterns from there, but not its look: energy has its own, see `app.css` and `docs/decisions.md`). Energy is integer watt hours in `reading`, kWh in `month_history`.

## Where things are

- `src/lib/server/glow.ts`: Glowmarkt API (sign-in, resources, half-hourly readings, max 10 days a request)
- `src/lib/server/sync.ts`: hourly sync: new readings, then backfills history 2 windows per run until a window is empty
- `src/lib/usage.ts`: months (readings win when they cover the whole month, else sheet history), their cost from the prices, both fuels combined, grouping by year, year-on-year comparison in kWh or £
- `src/lib/server/usage.ts`: the SQL behind it
- `src/lib/components/YearChart.svelte`: month-by-month lines, one per year
- `src/routes/+page.svelte`: the main page (`?fuel=gas|both&unit=gbp`); `/settings`: prices (`src/lib/server/tariffs.ts`) and sign out; `/sync`: called by the cron (`worker/entry.js`) with `SYNC_SECRET`
- `scripts/history.ts`: sheet CSV (`private/`, not in git) to SQL for `month_history`
- Schema: `src/lib/server/db/schema.ts`

## Commands

Same as budget: `npm test`, `npm run test:e2e`, `npm run check`, `npm run lint`, `scripts/shot.sh <path>`, `scripts/worktree.sh <branch>`. Wrangler: `CLOUDFLARE_API_TOKEN='op://Claude/Cloudflare/credential' op-claude run -- npx wrangler ...`

## Workflow

- Work in a worktree (`scripts/worktree.sh <branch>`), never in `~/code/energy` itself.
- `main` is what's live, so never push to it directly. Every change goes through a PR:
  1. Branch, commit, push, `gh pr create` (gh needs the PAT: `GH_TOKEN='op://Claude/GitHub Personal Access Token/token' op-claude run -- gh ...`).
  2. Straight away, run the `bug-hunter` and `simplifier` agents in parallel on the branch (repo path, base `main`). Apply real findings; skip any you disagree with and say why. Docs-only PRs skip this step.
  3. Push the fixes, then `scripts/pr-wait.sh` (with the PAT) for the Checks run (lint, types, unit, e2e).
  4. When green, send Jon the PR link, one line per finding (applied or skipped) and a screenshot if the UI changed (open it with Read).
  5. When Jon approves, merge (`gh pr merge --squash`); Cloudflare Workers Builds deploys `main` by itself, so then just `scripts/wait-deploy.sh`.
- Schema change: edit `schema.ts`, `npm run db:generate`, `npm run db:migrate:local`. The deploy applies migrations before the new code. Before merging, note a restore point (`wrangler d1 time-travel info energy`).
- Planned features are in `docs/roadmap.md`; keep it current. Keep docs current; record product or architecture choices (including ideas turned down) in `docs/decisions.md`.

## Review focus

A small household app: simple beats defensive. Cutting code is a good outcome, and bugs only matter if someone's likely to hit them. Watch for: UK time (BST, half hours to days), partial months, Workers CPU and D1 limits (100 bound values per query), Bright API limits (10 days per half-hourly request), sign-in checks on new routes.

## Gotchas

budget's CLAUDE.md gotchas apply here too (SvelteKit 3 imports, Workers CPU limit, unbound `fetch`, D1 limits, `db.batch` tuples, strict CSP). Also:

- `scripts/shot.sh` and the e2e tests use `.wrangler/e2e`, a fresh database with the fixtures in `e2e/fixtures.sql`.
- The sheet history (`private/`) is household data: keep it out of git.
