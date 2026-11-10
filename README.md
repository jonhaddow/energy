# Energy

Household gas and electricity use, compared year on year, as a phone web app.

It pulls half-hourly smart meter readings so you can see whether you're using more or less energy than the same time last year. Older monthly totals can be imported from a CSV.

## Tech stack

- [SvelteKit](https://svelte.dev) (Svelte 5) and TypeScript, as an installable PWA
- [Cloudflare Workers](https://workers.cloudflare.com), with [D1](https://developers.cloudflare.com/d1/) (SQLite) through [Drizzle ORM](https://orm.drizzle.team)
- Google sign-in ([Arctic](https://arcticjs.dev)) for an allowlist of users
- [Tailwind CSS](https://tailwindcss.com) and [shadcn-svelte](https://shadcn-svelte.com)
- Smart meter data from the [Glowmarkt](https://glowmarkt.com) (Bright) API, synced hourly by a cron trigger
- [Vitest](https://vitest.dev) and [Playwright](https://playwright.dev) for tests
- Deployed from `main` by Cloudflare Workers Builds

## Running locally

```sh
npm install
npm run db:migrate:local
npx wrangler d1 execute energy --local --command "INSERT INTO user (email, name) VALUES ('you@example.com', 'You')"
cp .dev.vars.example .dev.vars
npm run dev    # the login page has dev-only "Sign in as" buttons
```

Tests: `npm test` (unit), `npm run test:e2e` (Playwright), `npm run check` (types), `npm run lint`.
