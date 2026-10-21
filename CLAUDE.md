# Energy

Household gas and electricity use, compared year on year. A PWA at https://energy.app.haddow.me. Half-hourly smart meter readings come hourly from Bright (Hildebrand Glow's Glowmarkt API); months before the meter data come from the old Google Sheet ("Energy tracking", filled in from the Loop app). Energy is integer watt hours in `reading`, kWh in `month_history`.

Stack, workflow, commands and shared gotchas: the `app-stack` skill.

## Where things are

- `src/lib/server/glow.ts`: Glowmarkt API (sign-in, resources, half-hourly readings, max 10 days a request)
- `src/lib/server/sync.ts`: hourly sync: new readings, then backfills history 2 windows per run until a window is empty
- `src/lib/usage.ts`: months (readings win when they cover the whole month, else sheet history), their cost from the prices, both fuels combined, grouping by year, the rolling 12-month comparison in kWh or £
- `src/lib/server/usage.ts`: the SQL behind it
- `src/lib/server/weather.ts`: Open-Meteo: the location (geocoding), daily temperatures, heating degree days a month
- `src/lib/components/YearChart.svelte`: month-by-month lines, one per year
- `src/routes/+page.svelte`: the main page (`?fuel=gas|both&unit=gbp`); `/quotes`: offers priced on our last 12 months (`src/lib/server/quotes.ts`); `/settings`: prices (`src/lib/server/tariffs.ts`), location and sign out; `/sync`: called by the cron (`worker/entry.js`) with `SYNC_SECRET`
- `scripts/history.ts`: sheet CSV (`private/`, not in git) to SQL for `month_history`
- Schema: `src/lib/server/db/schema.ts`

## Review focus

UK time (BST, half hours to days), partial months, Bright API limits (10 days per half-hourly request).

## Notes

- The sheet history (`private/`) is household data: keep it out of git.
