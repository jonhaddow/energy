# Decisions

- **Bright (Hildebrand Glow) for meter data**, not the Loop app: Loop has no public API, while Glowmarkt has a documented one that reads the meter through the DCC. Free.
- **Half-hourly readings stored**, not daily totals: they're the raw data (owning it was a goal), a year is ~35k small rows across both fuels, and day/month totals group by the stored UK `day`.
- **Sheet history kept as monthly totals** (`month_history`), and readings replace a month only once they cover it fully, so a month the meter only partly covers doesn't look like a drop.
- **Backfill 2 windows per hourly run** (18 days per fuel): keeps each run within Workers' free-plan CPU and subrequest limits. About a year of history takes a day.
- **The sheet's "Year 1" and "Year 2" were imported as 2025 and 2026** (Year 2 has data to September, last edited October 2026). Check against the meter data once it backfills; fix by re-importing.
- **Not doing (October 2026)**: notes for life events on the charts (new boiler, insulation), monthly kWh or £ targets, and grid carbon intensity / greener timing. Jon wasn't interested.
- **Prices typed in on a Settings page** (`tariff`: fuel, start date, unit rate and standing charge in pence with VAT), not fetched: Ecotricity has no API. Prices stay in force until the next one for that fuel; editing is re-entering the same date.
- **Its own look, not budget's** (October 2026): Space Grotesk, warm paper and charcoal with amber for what matters now, flat bordered cards with 6px corners, small-capital labels. Budget's code patterns are still shared; its design isn't. Tried first: budget's design with just an amber accent.
- **No energy provider named in the app** (October 2026): the UI says nothing about Ecotricity, so it isn't tied to one supplier.
- **Costs calculated from the prices**, not the sheet's typed-in costs (`month_history.cost_pence`, which assumed 30-day months): every month is priced the same way. A month's kWh is spread evenly over its days, each day at that day's prices, so a mid-month price change splits the month. A month with a day before the first price has no cost.
- **Both = electricity + gas for the months both fuels have**; partial if either is. kWh add up as well as £, so both units work.
- **Laptop layout from 960px** (as budget): pages get `.page.wide` (1040px), and lay out in columns with grid areas. Home: headline and table on the left, the chart beside them (sticky). Settings: prices beside the form.
