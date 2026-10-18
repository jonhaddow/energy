# Roadmap

The aim: not just what we used, but whether it's more or less than it should be, and why.

## Live

- Year-on-year electricity and gas, month by month (chart, table), and the last 12 months against the 12 before.
- The old sheet's months (Jul 2024 – Sep 2026) imported; Bright sync on (login set up Oct 2026), waiting for Bright to get the meter data from the DCC.
- Settings: unit rates and standing charges, dated. Filled in from the sheet (2025 onwards).
- kWh or £ on every view, and a Both tab (electricity and gas together).
- Why the bill changed: the year-on-year £ change split into using less or more, and prices.
- Weather-adjusted gas: the 12-month comparison per heating degree day (Open-Meteo temperatures for the town set in Settings).
- The fixed part: standing charges a year at today's prices (in £). Price changes marked on the chart (in £).

## Phase 1: the basics with meter data

- **Bright sync on**: half-hourly readings hourly, history backfilled.
- **Two pages, Now and Trends**: Trends is today's page (months, year on year). Now, once readings arrive (hidden until then):
  - today so far, hour by hour, against a typical day for the time of year;
  - the last 30 days as daily bars, unusual days marked;
  - this week against a typical week, kWh and £.

## Phase 2: the big insights

- **Always-on use** (on Now): the overnight baseline (fridge, router, standby) as kWh and £ a year, and when it changes.
- **Weather-adjusted gas, by day** (on Now): use against the day's temperature, once readings arrive.
- **Bill forecast**: where this month is heading, and a check against Ecotricity's bill.

## Phase 3: saving money

- **Tariff checker**: our actual half hours priced on other tariffs (e.g. Octopus Agile, an overnight tariff).
- **Notifications**: unusual spikes (something on all night), a weekly summary. Reuse budget's web push.

## Phase 4: nice to have

- **Daily heatmap**: a year of days at a glance.
