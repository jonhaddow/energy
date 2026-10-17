# Roadmap

The aim: not just what we used, but whether it's more or less than it should be, and why.

## Live

- Year-on-year electricity and gas, month by month (chart, table, this year so far against the same months last year).
- The old sheet's months (2025–26) imported; Bright sync built, waiting for the Bright login.
- Settings: unit rates and standing charges, dated. Filled in from the sheet (2025 onwards).
- kWh or £ on every view, and a Both tab (electricity and gas together).
- Why the bill changed: the year-on-year £ change split into using less or more, and prices.

## Phase 1: the basics with meter data

- **Bright sync on**: half-hourly readings hourly, history backfilled.
- **Today and this week**: use so far against a typical day, hour by hour.

## Phase 2: the big insights

- **The fixed part**: what the standing charges cost a year, before using anything.
- **Price changes on the chart**: a marker where new prices start.
- **Always-on use**: the overnight baseline (fridge, router, standby) as kWh and £ a year, and when it changes.
- **Weather-adjusted gas**: local temperatures (Open-Meteo) so a cold winter doesn't look like worse heating; use per degree day, year on year.
- **Bill forecast**: where this month is heading, and a check against Ecotricity's bill.

## Phase 3: saving money

- **Tariff checker**: our actual half hours priced on other tariffs (e.g. Octopus Agile, an overnight tariff).
- **Notifications**: unusual spikes (something on all night), a weekly summary. Reuse budget's web push.

## Phase 4: nice to have

- **Daily heatmap**: a year of days at a glance.
- **Typical-home comparison**: against Ofgem's low, medium and high household figures.
