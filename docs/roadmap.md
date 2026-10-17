# Roadmap

The aim: not just what we used, but whether it's more or less than it should be, and why.

## Live

- Year-on-year electricity and gas, month by month (chart, table), and the last 12 months against the 12 before.
- The old sheet's months (Jul 2024 – Sep 2026) imported; Bright sync built, waiting for the Bright login.
- Settings: unit rates and standing charges, dated. Filled in from the sheet (2025 onwards).
- kWh or £ on every view, and a Both tab (electricity and gas together).
- Why the bill changed: the year-on-year £ change split into using less or more, and prices.

## Phase 1: the basics with meter data

- **Bright sync on**: half-hourly readings hourly, history backfilled.
- **Two pages, Current and Trends**: Trends is today's page (months, year on year). Current, once readings arrive:
  - today so far, hour by hour, against a typical day for the time of year;
  - the last 30 days as daily bars, unusual days marked;
  - this week against a typical week, kWh and £.

## Phase 2: the big insights

- **The fixed part**: what the standing charges cost a year, before using anything.
- **Price changes on the chart**: a marker where new prices start.
- **Always-on use** (on Current): the overnight baseline (fridge, router, standby) as kWh and £ a year, and when it changes.
- **Weather-adjusted gas**: local temperatures (Open-Meteo) so a cold winter doesn't look like worse heating; use per degree day, year on year.
- **Bill forecast**: where this month is heading, and a check against Ecotricity's bill.

## Phase 3: saving money

- **Tariff checker**: our actual half hours priced on other tariffs (e.g. Octopus Agile, an overnight tariff).
- **Notifications**: unusual spikes (something on all night), a weekly summary. Reuse budget's web push.

## Phase 4: nice to have

- **Daily heatmap**: a year of days at a glance.
- **Typical-home comparison**: against Ofgem's low, medium and high household figures.
