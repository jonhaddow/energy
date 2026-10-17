# Decisions

- **Bright (Hildebrand Glow) for meter data**, not the Loop app: Loop has no public API, while Glowmarkt has a documented one that reads the meter through the DCC. Free.
- **Half-hourly readings stored**, not daily totals: they're the raw data (owning it was a goal), a year is ~35k small rows across both fuels, and day/month totals group by the stored UK `day`.
- **Sheet history kept as monthly totals** (`month_history`), and readings replace a month only once they cover it fully, so a month the meter only partly covers doesn't look like a drop.
- **Backfill 2 windows per hourly run** (18 days per fuel): keeps each run within Workers' free-plan CPU and subrequest limits. About a year of history takes a day.
- **The sheet's "Year 1" and "Year 2" were imported as 2025 and 2026** (Year 2 has data to September, last edited October 2026). Check against the meter data once it backfills; fix by re-importing.
- **Not doing (October 2026)**: notes for life events on the charts (new boiler, insulation), monthly kWh or £ targets, and grid carbon intensity / greener timing. Jon wasn't interested.
- **Prices typed in on a Settings page** (`tariff`: fuel, start date, unit rate and standing charge in pence with VAT), not fetched: Ecotricity has no API. Prices stay in force until the next one for that fuel; editing is re-entering the same date.
