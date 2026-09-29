# fantasy.

The parent marketing site for the fantasy. family of fantasy football tools (design concept 2a, "On the record").

- Links out to the live tools: Wrapped and Rankings (URLs in `src/lib/tools.ts`).
- Hedge is not live yet; its card tags the email signup with source `hedge` (notify-me).
- Email signups are stored in Neon Postgres via `POST /api/subscribe` (validated, rate limited, honeypot-protected).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind v4, `motion`, Drizzle ORM + `@neondatabase/serverless`, zod, Vitest + Testing Library, Playwright. Node 22, pnpm.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm e2e` | Playwright tests; builds and serves the app on port 3100 itself |
| `pnpm db:migrate` | Apply migrations in `drizzle/` (loads `.env.local` if present) |

Run `pnpm exec playwright install chromium` once before the first `pnpm e2e`.

## Environment

- `DATABASE_URL`: Postgres connection string, put it in `.env.local` (see `.env.example`). Required by the API route and `pnpm db:migrate`.
- `TEST_DATABASE_URL`: optional. When set, `tests/integration/subscribe.db.test.ts` runs against that database; when unset the test is skipped. Use a throwaway database.

## Deploy

Deployed on Vercel through the GitHub integration (preview per PR, production from `main`). The database is Neon, provisioned through the Vercel Marketplace, which supplies `DATABASE_URL`. Run `pnpm db:migrate` against the target database when the schema changes.

CI (`.github/workflows/ci.yml`) runs lint, typecheck, unit tests and e2e.

## Layout

```
src/app/          routes, layout, global CSS (tokens), OG image and icons
src/app/api/      subscribe route handler
src/components/   hero, story card stack, email capture, tool cards, nav, footer
src/lib/          subscribe logic, rate limiter, tool URLs
src/db/           Drizzle schema and Neon client
drizzle/          generated SQL migrations
tests/            unit/, integration/, e2e/
docs/superpowers/ design spec (specs/) and implementation plan (plans/)
```
