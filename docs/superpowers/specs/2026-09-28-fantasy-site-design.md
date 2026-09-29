# fantasy. parent site: design spec

Date: 2026-09-28
Status: draft, awaiting user review

## Purpose

A marketing homepage for the "fantasy" parent brand (direction 1a "Period"). It builds interest in a family of fantasy football tools, links out to each live tool, and collects email signups. It does not host or embed the tools.

Source of truth for visuals, copy and tokens: `Fantasy tools brand design.zip` (`design_handoff_fantasy_brand_site/README.md`, concept **2a "On the record"**). Copy, colors, type, spacing and interactions are final and are used verbatim.

## Decisions (from user)

| Topic | Decision |
|---|---|
| Homepage concept | 2a "On the record". 2b and 2c are out of scope. |
| Site job | Marketing homepage plus links out plus email capture |
| Email store | Neon Postgres via Vercel Marketplace, own the list |
| Tool URLs | Looked up from Vercel (below) |
| Repo | `nardonef/fantasy`, public |
| Domain | Vercel default for now |
| Deploy | GitHub integration: preview per push, production on merge to `main` |

Tool destinations:
- Wrapped: `https://fantasywrapped.net` (live, "OPEN")
- Rankings: `https://fantasy-rankings-beige.vercel.app` (beta, "JOIN")
- Hedge: no link out. "NOTIFY ME" scrolls to the hero form and tags the signup `hedge`. (Assumption: Hedge is unreleased per the handoff, although a deployment exists at `fantasy-hedge.vercel.app`.)

## Stack

Next.js 16.3 (App Router, server components by default), React 19, TypeScript, Tailwind v4, `next/font/google` Geist and Geist Mono, `motion`, Drizzle ORM plus `@neondatabase/serverless`, zod, Vitest plus Testing Library, Playwright. Package manager pnpm, matching the sibling repos.

## Structure

```
src/app/
  layout.tsx            fonts, metadata, ::selection, theme tokens
  page.tsx              composes Nav, Hero, ToolCards, Footer
  globals.css           Tailwind v4 @theme tokens from the handoff
  icon.tsx apple-icon.tsx opengraph-image.tsx   (next/og, Geist)
  api/subscribe/route.ts
src/components/
  wordmark.tsx          <Wordmark tool? size /> (no images)
  nav.tsx footer.tsx
  hero.tsx
  story-card-stack.tsx  client
  email-capture.tsx     client
  tool-cards.tsx        three cards with static previews
src/lib/
  subscribe.ts          zod schema + insert (pure, testable)
  rate-limit.ts
src/db/schema.ts        signups table
public/wordmarks/*.svg  parent + 3 lockups, dark and light
```

Units and interfaces:
- `Wordmark`: props `{ tool?: 'wrapped'|'rankings'|'hedge'; size: number }`. Renders `fantasy` plus a dot (0.2em circle, baseline-aligned) in the tool color; the tool name appears in `#A1A1AA`.
- `StoryCardStack`: no props. Owns `cardIndex` and progress. Static content from a constant array.
- `EmailCapture`: props `{ source?: string }`. Owns `email`, `status`, `error`.
- `subscribe(input)`: `{ email, source? }` returns `{ ok: true } | { ok: false, error }`. It has no framework dependency.

## Behavior

**Nav.** Sticky, `#060607e6` with `backdrop-filter: blur(12px)` and a bottom hairline. Links: Wrapped, Rankings, Hedge. The CTA "Get early access" scrolls to the hero form.

**Hero.** Two-column grid (`1.15fr 1fr`) that stacks below 900px. Copy per handoff: kicker, h1 "It's all on the record" plus a 0.17em blue dot (`clamp(56px, 10vw, 112px)`), subcopy, the email form, and the helper line.

**Story card.** Three cards (Bench Regret, Waiver Steal, Archetype) with two decoy cards behind. It auto-advances every 4s. The active progress bar fills linearly over 4s, earlier bars are full and later bars empty. Click or tap advances and resets the timer. It pauses on hover and while the tab is hidden. Under `prefers-reduced-motion` it does not auto-advance. Crossfade or slide takes about 300ms with ease `[0.16, 1, 0.3, 1]`. Width is `min(340px, 80vw)` at 9:16.

**Tool cards.** Three columns (one below 900px). Each has a 200px preview, lockup, one-line description, and CTA meta line in the tool color. Previews are static: two mini story cards (Wrapped), a tier board (Rankings), a contract ticket (Hedge). A tool color appears only within that tool's context.

**Email form.**
- States: `idle | loading | success | error`. The button shows `…` while loading.
- On success it becomes the "You're on the list. We'll keep it brief." panel.
- On error the input border becomes `#FF4A31` and red text replaces the helper line.
- The input is `type=email` and required.
- The form includes a hidden honeypot field.

**`POST /api/subscribe`.**
1. Parse the body with zod (email string, at most 254 chars, valid format; `source` optional, in `{hero, wrapped, rankings, hedge}`).
2. If the honeypot is filled, return success without inserting.
3. Apply a per-IP rate limit (in-memory, best effort per instance; acceptable for a low-traffic list).
4. Insert into `signups`. On unique-violation, return success (does not reveal whether an email exists).
5. Invalid input returns 400 with a generic message. Database failure returns 500 with a generic message and is logged.

**Data.** Table `signups(id serial pk, email text unique not null, source text not null default 'hero', created_at timestamptz default now())`. Emails are stored lowercased and trimmed.

## Responsive and accessibility

- Max content width 1200px, gutter 48px (reduced on mobile), touch targets at least 44px.
- No horizontal scroll at 375px.
- Text and accent colors use the handoff's AA-safe pairs.
- All interactive elements are keyboard-operable with visible focus.
- The story card is a `<button>` with an accessible label, and auto-advance does not use a live region.

## Assets

Generated at build time or committed as SVG: wordmark SVGs (parent + 3 lockups, dark and light), favicons 16/32, app icon 180/512, and a parent OG image (1200x630, "Your league, measured." on `#060607`, wordmark on top, `WRAPPED · RANKINGS · HEDGE` at the bottom). The Wrapped share OG is out of scope.

## Testing

Written alongside each unit, and all must pass before the unit is considered done:
- **Unit (Vitest):** `subscribe` schema (valid, invalid, oversized, case and whitespace normalization, unknown source); rate limiter.
- **Integration:** `/api/subscribe` route against a real Postgres (Neon branch or local): insert, duplicate returns success with one row, honeypot inserts nothing, bad input returns 400.
- **Component (Testing Library, fake timers):** story-card auto-advance, click advance, pause on hover, reduced-motion disables timer; email form state transitions and error styling.
- **E2E (Playwright, 375px and 1280px):** page renders all sections, form success path, no horizontal scroll.
- Lint and typecheck run in CI on every push.

## Delivery

1. Create public repo `nardonef/fantasy` and push a feature branch (never force-push or push directly to `main`).
2. Link the Vercel project via the GitHub integration in the `Frank's projects` team.
3. Provision Neon through the Vercel Marketplace and confirm with the user before creating billable resources. Set `DATABASE_URL` for Production and Preview, and run the Drizzle migration.
4. Open a draft PR. Verify the preview deployment. Merging to `main` deploys production.
5. Update MEMORY.md and the relevant memory files as the final step.

## Out of scope

Concepts 2b and 2c, analytics, an admin view of signups (query Neon directly), per-tool tagging beyond the `source` string, the Wrapped share OG, and a custom domain.

## Open assumptions to confirm

- Hedge stays "notify me" with no link out.
- Footer copy `FANTASY · 2026` and `NOT AFFILIATED WITH THE NFL` are used verbatim.
- The repo is public, so no secrets go in it.
