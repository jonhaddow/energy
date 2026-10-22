# Energy

Household gas and electricity use, compared year on year. A PWA at https://energy.app.haddow.me. Half-hourly smart meter readings come hourly from Bright (Hildebrand Glow's Glowmarkt API); months before the meter data come from the old Google Sheet ("Energy tracking", filled in from the Loop app). Energy is integer watt hours in `reading`, kWh in `month_history`.

Stack, workflow, commands and shared gotchas: the `app-stack` skill.

## Worth knowing

- Bright (`glow.ts`) gives at most 10 days of half-hourly readings a request. The hourly sync fetches new readings, then backfills history 2 windows a run until a window is empty.
- A month uses meter readings when they cover all of it, else the sheet history (`month_history`, loaded by `scripts/history.ts` from a CSV in `private/`).
- Weather (heating degree days) is Open-Meteo.
- The sheet history (`private/`) is household data: keep it out of git.

## Review focus

UK time (BST, half hours to days), partial months, Bright API limits (10 days per half-hourly request).
