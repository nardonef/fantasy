# fantasy. parent site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and deploy the "fantasy" parent marketing site (concept 2a "On the record") that links to the live tools and stores email signups in Neon.

**Architecture:** One Next.js 16.3 App Router app. Server components by default; `StoryCardStack` and `EmailCapture` are the only client components. Business logic for signups lives in a framework-free `src/lib/subscribe.ts` with an injected `insert` dependency so it is unit-testable; `app/api/subscribe/route.ts` is a thin adapter that wires Drizzle + Neon and the rate limiter. Tokens are Tailwind v4 `@theme` values copied from the handoff.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, Tailwind v4, `next/font/google` (Geist, Geist Mono), `motion`, Drizzle ORM + `@neondatabase/serverless`, zod, Vitest + Testing Library (jsdom), Playwright, pnpm.

**Spec:** `docs/superpowers/specs/2026-09-28-fantasy-site-design.md`. Visual/copy source of truth: the design handoff zip (Fantasy tools brand design.zip, README.md inside `design_handoff_fantasy_brand_site/`) — concept 2a. If the zip has been moved, re-unzip if needed.

## Global Constraints

- Concept 2a only. 2b and 2c are out of scope.
- Next.js 16.3, React 19, TypeScript, Tailwind v4, pnpm.
- Fonts: Geist (400/500/600/700) and Geist Mono (400/500) via `next/font/google`.
- Wordmark is a React component, not an image: `fantasy` Geist 600, letter-spacing -0.05em, line-height 1, followed by a dot of width = height = 0.2em, `margin-left: 0.04em`, baseline-aligned. Parent dot `#5B8CFF` (on light surfaces `#2148D8`).
- Colors (verbatim): page `#060607`, field `#0A0A0B`, surface-2 `#0F0F12`, raised `#16161A`, raised-2 `#101014`, input-bg `#0E0E16`, hairline `#1C1C21`, hairline-2 `#26262E`, input-border `#262633`, chalk `#FAFAFA`, chalk-dim `#A1A1AA`, chalk-faint `#71717A`, chalk-muted `#52525B`, signal/wrapped `#5B8CFF`, signal-hover `#7089F8`, signal-on-light `#2148D8`, rankings `#4CD48F`, hedge `#F2B441`, regret `#FF4A31`, success panel bg `#1C1F33` border `#5B8CFF66`.
- A tool color appears only inside that tool's context.
- Voice: second person, deadpan, no exclamation marks, no emoji.
- Story card auto-advances every 4000ms; click advances and resets; pauses on hover and hidden tab; no auto-advance under `prefers-reduced-motion`; width `min(340px, 80vw)`, 9:16.
- Email: stored trimmed + lowercased; max 254 chars; `source` in `hero | wrapped | rankings | hedge`; duplicate returns success; honeypot filled returns success without insert; generic error messages only.
- Tool links: Wrapped `https://fantasywrapped.net`, Rankings `https://fantasy-rankings-beige.vercel.app`, Hedge has no link out (scrolls to the form, source `hedge`).
- No secrets in the repo (it is public). `DATABASE_URL` only in Vercel env / local `.env.local` (gitignored).
- Never push to `main`, never force-push. Commit messages carry no AI attribution trailer (user's global rule).
- Every new function/module/endpoint ships with tests in the same task; tests must pass before moving on.

## Review Focus

1. Email casing/whitespace: `  Frank@Example.COM ` and `frank@example.com` must dedupe to one row. (Task 3, Task 4)
2. Malformed request body (invalid JSON, empty body, JSON array, wrong types) to `/api/subscribe` must return 400, never 500. (Task 4)
3. Database unavailable or `DATABASE_URL` unset must return a generic 500 and the form must keep the user's typed email and show an error. (Task 4, Task 5)
4. Double-submit / rapid Enter presses on the form must send one request while loading. (Task 5)
5. Story card: rapid clicks and tab hide/show must not double-advance or skip; index wraps 2 → 0; hover pause must not reset progress. (Task 6)

---

## File Structure

```
package.json, pnpm-lock.yaml, tsconfig.json, next.config.ts, postcss.config.mjs
vitest.config.ts, vitest.setup.ts, playwright.config.ts, drizzle.config.ts
.github/workflows/ci.yml
.env.example
src/app/layout.tsx  page.tsx  globals.css  icon.tsx  apple-icon.tsx  opengraph-image.tsx
src/app/api/subscribe/route.ts
src/assets/Geist-SemiBold.ttf
src/components/wordmark.tsx  nav.tsx  footer.tsx  hero.tsx
src/components/story-card-stack.tsx  email-capture.tsx  tool-cards.tsx
src/lib/subscribe.ts  rate-limit.ts  tools.ts
src/db/schema.ts  db/index.ts
drizzle/ (generated migration)
public/wordmarks/*.svg
tests/unit/*.test.ts(x)   tests/e2e/home.spec.ts   tests/integration/subscribe.db.test.ts
```

Work happens in a git worktree of this repo (branch `feat/site`), created at execution time.

---

### Task 1: Scaffold, tokens, fonts, test tooling

**Files:**
- Create: everything `create-next-app` generates, plus `vitest.config.ts`, `vitest.setup.ts`, `.env.example`
- Modify: `src/app/globals.css`, `src/app/layout.tsx`, `package.json`
- Test: `tests/unit/tokens.test.ts`

**Interfaces:**
- Produces: Tailwind theme colors usable as `bg-page`, `text-chalk-dim`, `text-wrapped`, `text-rankings`, `text-hedge`, `text-regret`, `border-hairline`, etc.; CSS vars `--font-geist` and `--font-geist-mono` applied as `font-sans` / `font-mono`; `pnpm test` runs Vitest.

- [ ] **Step 1: Scaffold Next into the (non-empty) worktree**

```bash
cd <worktree>
pnpm create next-app@latest . --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm --yes
pnpm add motion zod drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom @playwright/test
```
Expected: `pnpm build` later succeeds. If create-next-app refuses due to existing files, move `docs/` and `.claude/` aside, scaffold, move them back. Confirm `node_modules/next/package.json` version is 16.3.x; if a newer patch installs, keep it.

- [ ] **Step 2: Write the failing token test**

`tests/unit/tokens.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync("src/app/globals.css", "utf8").toLowerCase();

describe("brand tokens", () => {
  it.each([
    ["page", "#060607"], ["field", "#0a0a0b"], ["surface-2", "#0f0f12"],
    ["raised", "#16161a"], ["hairline", "#1c1c21"], ["chalk", "#fafafa"],
    ["wrapped", "#5b8cff"], ["rankings", "#4cd48f"], ["hedge", "#f2b441"],
    ["regret", "#ff4a31"], ["signal-on-light", "#2148d8"],
  ])("defines --color-%s as %s", (name, hex) => {
    expect(css).toContain(`--color-${name}: ${hex}`);
  });
});
```

- [ ] **Step 3: Add Vitest config and setup, run test, see it fail**

`vitest.config.ts`:
```ts
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    setupFiles: ["./vitest.setup.ts"],
    include: ["tests/unit/**/*.test.{ts,tsx}", "tests/integration/**/*.test.ts"],
  },
});
```
`vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => cleanup());

if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false, media: query, onchange: null,
    addEventListener: vi.fn(), removeEventListener: vi.fn(),
    addListener: vi.fn(), removeListener: vi.fn(), dispatchEvent: vi.fn(),
  }));
}
```
Add to `package.json` scripts: `"test": "vitest run"`, `"typecheck": "tsc --noEmit"`.
Run: `pnpm test tests/unit/tokens.test.ts` → Expected: FAIL (tokens missing).

- [ ] **Step 4: Write tokens and fonts**

Replace `src/app/globals.css`:
```css
@import "tailwindcss";

@theme {
  --color-page: #060607;
  --color-field: #0a0a0b;
  --color-surface-2: #0f0f12;
  --color-raised: #16161a;
  --color-raised-2: #101014;
  --color-input-bg: #0e0e16;
  --color-hairline: #1c1c21;
  --color-hairline-2: #26262e;
  --color-input-border: #262633;
  --color-chalk: #fafafa;
  --color-chalk-dim: #a1a1aa;
  --color-chalk-faint: #71717a;
  --color-chalk-muted: #52525b;
  --color-chalk-faintest: #3f3f46;
  --color-wrapped: #5b8cff;
  --color-signal-hover: #7089f8;
  --color-signal-on-light: #2148d8;
  --color-rankings: #4cd48f;
  --color-hedge: #f2b441;
  --color-regret: #ff4a31;
  --color-regret-on-light: #b83523;
  --font-sans: var(--font-geist), ui-sans-serif, system-ui, sans-serif;
  --font-mono: var(--font-geist-mono), ui-monospace, monospace;
  --ease-wrapped: cubic-bezier(0.16, 1, 0.3, 1);
}

html { background: var(--color-page); color: var(--color-chalk); scroll-behavior: smooth; }
body { font-family: var(--font-sans); -webkit-font-smoothing: antialiased; }
::selection { background: var(--color-wrapped); color: var(--color-field); }
h1, h2, h3 { text-wrap: balance; }
p { text-wrap: pretty; }
@media (prefers-reduced-motion: reduce) { html { scroll-behavior: auto; } }
```
`src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ variable: "--font-geist", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: "fantasy.",
  description: "Fantasy football tools that remember what you'd rather forget.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```
Create `.env.example` with `DATABASE_URL=postgres://user:pass@host/db?sslmode=require`. Confirm `.gitignore` contains `.env*.local` and `.env`.

- [ ] **Step 5: Run tests, lint, typecheck, build**

Run: `pnpm test && pnpm lint && pnpm typecheck && pnpm build`
Expected: all PASS.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: scaffold Next 16 app with brand tokens, fonts and Vitest"
```

---

### Task 2: Wordmark component and SVG exports

**Files:**
- Create: `src/components/wordmark.tsx`, `public/wordmarks/{fantasy,wrapped,rankings,hedge}-{dark,light}.svg`
- Test: `tests/unit/wordmark.test.tsx`

**Interfaces:**
- Produces: `Wordmark({ tool?: "wrapped" | "rankings" | "hedge"; size: number; light?: boolean })`. Renders `<span role="img" aria-label="fantasy" | "fantasy wrapped">` etc. Exports `TOOL_COLOR: Record<ToolId, string>` from `src/lib/tools.ts` (created here).

- [ ] **Step 1: Write the failing test**

`tests/unit/wordmark.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Wordmark } from "@/components/wordmark";

describe("Wordmark", () => {
  it("renders the parent brand with an accessible label", () => {
    render(<Wordmark size={24} />);
    expect(screen.getByRole("img", { name: "fantasy" })).toBeInTheDocument();
  });

  it("renders a tool lockup with the tool name and tool dot color", () => {
    render(<Wordmark size={26} tool="rankings" />);
    const el = screen.getByRole("img", { name: "fantasy rankings" });
    expect(el).toHaveTextContent("rankings");
    expect(el.querySelector("[data-dot]")).toHaveStyle({ backgroundColor: "#4CD48F" });
  });

  it("uses the on-light blue for the parent dot on light surfaces", () => {
    render(<Wordmark size={24} light />);
    expect(screen.getByRole("img", { name: "fantasy" }).querySelector("[data-dot]"))
      .toHaveStyle({ backgroundColor: "#2148D8" });
  });
});
```
- [ ] **Step 2: Run to verify fail**

Run: `pnpm test tests/unit/wordmark.test.tsx` → Expected: FAIL (module not found).

- [ ] **Step 3: Implement**

`src/lib/tools.ts`:
```ts
export type ToolId = "wrapped" | "rankings" | "hedge";

export const TOOL_COLOR: Record<ToolId, string> = {
  wrapped: "#5B8CFF",
  rankings: "#4CD48F",
  hedge: "#F2B441",
};

export const PARENT_DOT = "#5B8CFF";
export const PARENT_DOT_ON_LIGHT = "#2148D8";

export const TOOL_URL: Record<"wrapped" | "rankings", string> = {
  wrapped: "https://fantasywrapped.net",
  rankings: "https://fantasy-rankings-beige.vercel.app",
};
```
`src/components/wordmark.tsx`:
```tsx
import { PARENT_DOT, PARENT_DOT_ON_LIGHT, TOOL_COLOR, type ToolId } from "@/lib/tools";

type Props = { size: number; tool?: ToolId; light?: boolean; letterSpacing?: string };

export function Wordmark({ size, tool, light = false, letterSpacing = "-0.05em" }: Props) {
  const dot = tool ? TOOL_COLOR[tool] : light ? PARENT_DOT_ON_LIGHT : PARENT_DOT;
  return (
    <span
      role="img"
      aria-label={tool ? `fantasy ${tool}` : "fantasy"}
      className="inline-flex items-baseline font-semibold leading-none"
      style={{ fontSize: size, letterSpacing }}
    >
      <span aria-hidden>fantasy</span>
      <span
        aria-hidden
        data-dot
        className="inline-block rounded-full"
        style={{
          width: "0.2em", height: "0.2em", backgroundColor: dot,
          margin: tool ? "0 0.14em 0 0.04em" : "0 0 0 0.04em",
        }}
      />
      {tool && <span aria-hidden className={light ? "text-chalk-muted" : "text-chalk-dim"}>{tool}</span>}
    </span>
  );
}
```
- [ ] **Step 4: Run tests** → `pnpm test tests/unit/wordmark.test.tsx` PASS.

- [ ] **Step 5: Write SVG exports**

Create the eight files under `public/wordmarks/` using this template (Geist has no embedded outline, so use `font-family="Geist, Inter, Arial, sans-serif"` and note in the SVG comment they are for OG/email where Geist is unavailable only as fallback). Parent dark example `fantasy-dark.svg`:
```svg
<svg xmlns="http://www.w3.org/2000/svg" width="240" height="60" viewBox="0 0 240 60">
  <rect width="240" height="60" fill="#060607"/>
  <text x="0" y="46" font-family="Geist, Inter, Arial, sans-serif" font-weight="600" font-size="48" letter-spacing="-2.4" fill="#FAFAFA">fantasy</text>
  <circle cx="157" cy="41" r="5" fill="#5B8CFF"/>
</svg>
```
Light variant: rect `#FAFAFA`, text `#0A0A0B`, dot `#2148D8`. Tool lockups add `<text ... fill="#A1A1AA">wrapped</text>` (`#52525B` on light) after the dot and use the tool color; use widths 420 (wrapped), 440 (rankings), 380 (hedge) and position the tool name at `x=172`.
Run: `for f in public/wordmarks/*.svg; do xmllint --noout "$f" || exit 1; done` → Expected: no output (valid XML).

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat: add Wordmark component, tool constants and SVG exports"
```

---

### Task 3: Subscribe logic and rate limiter (pure, TDD)

**Files:**
- Create: `src/lib/subscribe.ts`, `src/lib/rate-limit.ts`
- Test: `tests/unit/subscribe.test.ts`, `tests/unit/rate-limit.test.ts`

**Interfaces:**
- Produces:
  - `type Source = "hero" | "wrapped" | "rankings" | "hedge"`
  - `type SubscribeDeps = { insert: (email: string, source: Source) => Promise<void> }`
  - `type SubscribeResult = { ok: true } | { ok: false; status: 400 | 500; error: string }`
  - `handleSubscribe(body: unknown, deps: SubscribeDeps): Promise<SubscribeResult>`
  - `createRateLimiter({ limit, windowMs, now? }): { check(key: string): boolean }` (true = allowed)

- [ ] **Step 1: Write failing tests**

`tests/unit/subscribe.test.ts`:
```ts
import { describe, expect, it, vi } from "vitest";
import { handleSubscribe } from "@/lib/subscribe";

const deps = () => ({ insert: vi.fn().mockResolvedValue(undefined) });

describe("handleSubscribe", () => {
  it("normalizes email (trim + lowercase) and defaults source to hero", async () => {
    const d = deps();
    const r = await handleSubscribe({ email: "  Frank@Example.COM " }, d);
    expect(r).toEqual({ ok: true });
    expect(d.insert).toHaveBeenCalledWith("frank@example.com", "hero");
  });

  it("passes through a valid source", async () => {
    const d = deps();
    await handleSubscribe({ email: "a@b.co", source: "hedge" }, d);
    expect(d.insert).toHaveBeenCalledWith("a@b.co", "hedge");
  });

  it.each([
    ["missing email", {}],
    ["not an email", { email: "nope" }],
    ["email too long", { email: `${"a".repeat(250)}@b.co` }],
    ["unknown source", { email: "a@b.co", source: "twitter" }],
    ["email wrong type", { email: 42 }],
    ["array body", []],
    ["null body", null],
    ["string body", "hi"],
  ])("rejects %s with 400 and no insert", async (_n, body) => {
    const d = deps();
    const r = await handleSubscribe(body, d);
    expect(r).toEqual({ ok: false, status: 400, error: "Enter a valid email address." });
    expect(d.insert).not.toHaveBeenCalled();
  });

  it("returns success without inserting when the honeypot is filled", async () => {
    const d = deps();
    const r = await handleSubscribe({ email: "a@b.co", company: "Acme" }, d);
    expect(r).toEqual({ ok: true });
    expect(d.insert).not.toHaveBeenCalled();
  });

  it("returns a generic 500 when insert throws", async () => {
    const d = { insert: vi.fn().mockRejectedValue(new Error("connection refused: secret-host")) };
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await handleSubscribe({ email: "a@b.co" }, d);
    expect(r).toEqual({ ok: false, status: 500, error: "Something broke on our end. Try again." });
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
```
`tests/unit/rate-limit.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to limit within the window then blocks", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 2, windowMs: 1000, now: () => t });
    expect(rl.check("ip")).toBe(true);
    expect(rl.check("ip")).toBe(true);
    expect(rl.check("ip")).toBe(false);
  });
  it("tracks keys independently", () => {
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0 });
    expect(rl.check("a")).toBe(true);
    expect(rl.check("b")).toBe(true);
  });
  it("allows again after the window passes", () => {
    let t = 0;
    const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: () => t });
    expect(rl.check("ip")).toBe(true);
    expect(rl.check("ip")).toBe(false);
    t = 1001;
    expect(rl.check("ip")).toBe(true);
  });
});
```
- [ ] **Step 2: Run to verify fail** → `pnpm test tests/unit/subscribe.test.ts tests/unit/rate-limit.test.ts` FAIL (modules missing).

- [ ] **Step 3: Implement**

`src/lib/subscribe.ts`:
```ts
import { z } from "zod";

export const SOURCES = ["hero", "wrapped", "rankings", "hedge"] as const;
export type Source = (typeof SOURCES)[number];

export type SubscribeDeps = { insert: (email: string, source: Source) => Promise<void> };
export type SubscribeResult = { ok: true } | { ok: false; status: 400 | 500; error: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  source: z.enum(SOURCES).default("hero"),
  company: z.string().optional(),
});

export async function handleSubscribe(body: unknown, deps: SubscribeDeps): Promise<SubscribeResult> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, error: "Enter a valid email address." };
  const { email, source, company } = parsed.data;
  if (company) return { ok: true };
  try {
    await deps.insert(email, source);
    return { ok: true };
  } catch (err) {
    console.error("subscribe insert failed", err);
    return { ok: false, status: 500, error: "Something broke on our end. Try again." };
  }
}
```
Note: zod 4 exposes `z.email()`; if the installed zod is v3, use `z.string().email()` instead (check `pnpm list zod`).
`src/lib/rate-limit.ts`:
```ts
type Options = { limit: number; windowMs: number; now?: () => number };

export function createRateLimiter({ limit, windowMs, now = Date.now }: Options) {
  const hits = new Map<string, number[]>();
  return {
    check(key: string): boolean {
      const t = now();
      const recent = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(t);
      hits.set(key, recent);
      return true;
    },
  };
}
```
- [ ] **Step 4: Run tests** → PASS.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add subscribe handler and rate limiter with tests"
```

---

### Task 4: Database schema and `/api/subscribe` route

**Files:**
- Create: `src/db/schema.ts`, `src/db/index.ts`, `src/app/api/subscribe/route.ts`, `drizzle.config.ts`
- Test: `tests/unit/subscribe-route.test.ts`, `tests/integration/subscribe.db.test.ts`

**Interfaces:**
- Consumes: `handleSubscribe`, `createRateLimiter` (Task 3).
- Produces: `signups` table (`id serial pk`, `email text unique not null`, `source text not null default 'hero'`, `created_at timestamptz default now() not null`); `getDb()` (throws if `DATABASE_URL` unset); `POST /api/subscribe` returning `{ ok: true }` (200) or `{ error }` (400, 429, 500); `insertSignup(email, source)` exported from `src/db/index.ts`.

- [ ] **Step 1: Write the failing route test (module mocked, no DB)**

`tests/unit/subscribe-route.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const insertSignup = vi.fn();
vi.mock("@/db", () => ({ insertSignup: (...a: unknown[]) => insertSignup(...a) }));

async function post(body: BodyInit | null, headers: Record<string, string> = {}) {
  const { POST } = await import("@/app/api/subscribe/route");
  return POST(new Request("http://x/api/subscribe", { method: "POST", body, headers: { "x-forwarded-for": "1.1.1.1", ...headers } }));
}

beforeEach(() => { vi.resetModules(); insertSignup.mockReset().mockResolvedValue(undefined); });

describe("POST /api/subscribe", () => {
  it("200 on valid email", async () => {
    const res = await post(JSON.stringify({ email: "A@b.co" }), { "content-type": "application/json" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(insertSignup).toHaveBeenCalledWith("a@b.co", "hero");
  });

  it.each([["invalid json", "{nope"], ["empty body", ""], ["json array", "[]"], ["json string", '"x"']])(
    "400 (not 500) on %s", async (_n, raw) => {
      const res = await post(raw);
      expect(res.status).toBe(400);
      expect(insertSignup).not.toHaveBeenCalled();
    });

  it("500 with generic message when the database throws", async () => {
    insertSignup.mockRejectedValue(new Error("DATABASE_URL is not set"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    const res = await post(JSON.stringify({ email: "a@b.co" }));
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("DATABASE_URL");
  });

  it("429 after too many requests from one IP", async () => {
    let last = 200;
    for (let i = 0; i < 8; i++) last = (await post(JSON.stringify({ email: `u${i}@b.co` }))).status;
    expect(last).toBe(429);
  });
});
```
- [ ] **Step 2: Run to verify fail** → `pnpm test tests/unit/subscribe-route.test.ts` FAIL.

- [ ] **Step 3: Implement**

`src/db/schema.ts`:
```ts
import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const signups = pgTable("signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("hero"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
```
`src/db/index.ts`:
```ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { signups } from "./schema";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url));
}

export async function insertSignup(email: string, source: string) {
  await getDb().insert(signups).values({ email, source }).onConflictDoNothing({ target: signups.email });
}
```
`src/app/api/subscribe/route.ts`:
```ts
import { insertSignup } from "@/db";
import { createRateLimiter } from "@/lib/rate-limit";
import { handleSubscribe } from "@/lib/subscribe";

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!limiter.check(ip)) {
    return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  let body: unknown = null;
  try { body = await req.json(); } catch { /* falls through to 400 via schema */ }
  const result = await handleSubscribe(body, { insert: insertSignup });
  if (result.ok) return Response.json({ ok: true });
  return Response.json({ error: result.error }, { status: result.status });
}
```
`drizzle.config.ts`:
```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL ?? "" },
});
```
- [ ] **Step 4: Run route tests** → PASS. The 429 test relies on the in-module limiter (limit 5); `vi.resetModules()` gives each test a fresh limiter.

- [ ] **Step 5: Generate the migration**

Run: `pnpm drizzle-kit generate` → Expected: `drizzle/0000_*.sql` containing `CREATE TABLE "signups"` with a unique constraint on `email`. Add script `"db:migrate": "drizzle-kit migrate"`.

- [ ] **Step 6: Write the integration test (runs in Task 10 once Neon exists)**

`tests/integration/subscribe.db.test.ts`:
```ts
import { neon } from "@neondatabase/serverless";
import { beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)("subscribe against real Postgres", () => {
  beforeAll(() => { process.env.DATABASE_URL = url; });

  it("dedupes case/whitespace variants to one row and honeypot inserts nothing", async () => {
    const { insertSignup } = await import("@/db");
    const { handleSubscribe } = await import("@/lib/subscribe");
    const sql = neon(url as string);
    const tag = `it-${Date.now()}@example.com`;
    await handleSubscribe({ email: `  ${tag.toUpperCase()} ` }, { insert: insertSignup });
    await handleSubscribe({ email: tag }, { insert: insertSignup });
    await handleSubscribe({ email: `hp-${tag}`, company: "x" }, { insert: insertSignup });
    const rows = await sql`select email from signups where email in (${tag}, ${`hp-${tag}`})`;
    expect(rows).toEqual([{ email: tag }]);
    await sql`delete from signups where email = ${tag}`;
  });
});
```
Run: `pnpm test tests/integration` → Expected: 1 skipped (no `TEST_DATABASE_URL`). Task 10 runs it for real and must show it passing, not skipped.

- [ ] **Step 7: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck && git add -A && git commit -m "feat: add signups schema, migration and /api/subscribe route"
```

---

### Task 5: EmailCapture component

**Files:**
- Create: `src/components/email-capture.tsx`
- Test: `tests/unit/email-capture.test.tsx`

**Interfaces:**
- Consumes: `POST /api/subscribe` contract (Task 4), `Source` type (Task 3).
- Produces: `EmailCapture({ source?: Source; id?: string; light?: boolean })`. Root element carries the passed `id`. Exposes a `window` `CustomEvent<Source>` listener `"fantasy:source"` so the Hedge "Notify me" card can set the tag before scrolling (Task 7 dispatches it).

- [ ] **Step 1: Write failing tests**

`tests/unit/email-capture.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EmailCapture } from "@/components/email-capture";

afterEach(() => vi.unstubAllGlobals());

const mockFetch = (impl: () => Promise<Partial<Response>>) => {
  const f = vi.fn(impl);
  vi.stubGlobal("fetch", f);
  return f;
};

describe("EmailCapture", () => {
  it("shows the success panel after a 200", async () => {
    mockFetch(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    render(<EmailCapture />);
    await userEvent.type(screen.getByPlaceholderText("you@yourleague.com"), "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: /get access/i }));
    expect(await screen.findByText("You're on the list. We'll keep it brief.")).toBeInTheDocument();
  });

  it("shows the server error, keeps the typed email, and flags the input", async () => {
    mockFetch(async () => ({ ok: false, json: async () => ({ error: "Something broke on our end. Try again." }) }));
    render(<EmailCapture />);
    const input = screen.getByPlaceholderText("you@yourleague.com");
    await userEvent.type(input, "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: /get access/i }));
    expect(await screen.findByText("Something broke on our end. Try again.")).toBeInTheDocument();
    expect(input).toHaveValue("a@b.co");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a network error message when fetch rejects", async () => {
    mockFetch(async () => { throw new Error("offline"); });
    render(<EmailCapture />);
    await userEvent.type(screen.getByPlaceholderText("you@yourleague.com"), "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: /get access/i }));
    expect(await screen.findByText("Couldn't reach the server. Try again.")).toBeInTheDocument();
  });

  it("sends exactly one request when submitted twice while loading", async () => {
    let resolve!: (v: Partial<Response>) => void;
    const f = mockFetch(() => new Promise((r) => { resolve = r; }));
    render(<EmailCapture />);
    await userEvent.type(screen.getByPlaceholderText("you@yourleague.com"), "a@b.co{enter}{enter}");
    expect(f).toHaveBeenCalledTimes(1);
    resolve({ ok: true, json: async () => ({ ok: true }) });
    await waitFor(() => expect(screen.getByText(/on the list/i)).toBeInTheDocument());
  });

  it("posts the source and the honeypot value", async () => {
    const f = mockFetch(async () => ({ ok: true, json: async () => ({ ok: true }) }));
    render(<EmailCapture source="hedge" />);
    await userEvent.type(screen.getByPlaceholderText("you@yourleague.com"), "a@b.co");
    await userEvent.click(screen.getByRole("button", { name: /get access/i }));
    const body = JSON.parse((f.mock.calls[0] as unknown as [string, RequestInit])[1].body as string);
    expect(body).toMatchObject({ email: "a@b.co", source: "hedge", company: "" });
  });
});
```
- [ ] **Step 2: Run to verify fail** → FAIL (module missing).

- [ ] **Step 3: Implement**

`src/components/email-capture.tsx`:
```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import type { Source } from "@/lib/subscribe";

type Status = "idle" | "loading" | "success" | "error";

export function EmailCapture({ source = "hero", id, light = false }: { source?: Source; id?: string; light?: boolean }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>();
  const [tag, setTag] = useState<Source>(source);
  const inFlight = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onTag = (e: Event) => {
      setTag((e as CustomEvent<Source>).detail);
      inputRef.current?.focus({ preventScroll: true });
    };
    window.addEventListener("fantasy:source", onTag);
    return () => window.removeEventListener("fantasy:source", onTag);
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setStatus("loading");
    setError(undefined);
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, source: tag, company }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.ok) { setStatus("success"); return; }
      setError(data.error ?? "Something broke on our end. Try again.");
      setStatus("error");
    } catch {
      setError("Couldn't reach the server. Try again.");
      setStatus("error");
    } finally {
      inFlight.current = false;
    }
  }

  if (status === "success") {
    return (
      <div id={id} className="flex h-14 max-w-[460px] items-center gap-3 rounded-[9px] border border-[#5B8CFF66] bg-[#1C1F33] px-[18px] text-[15px]">
        <span className="size-2 rounded-full bg-wrapped" aria-hidden />
        You&apos;re on the list. We&apos;ll keep it brief.
      </div>
    );
  }

  const inputBase = light
    ? "bg-white border-[#D4D4D8] text-field placeholder:text-[#71717A]"
    : "bg-input-bg border-input-border text-[#F4F4F7] placeholder:text-[#4A4A58]";
  return (
    <form id={id} onSubmit={onSubmit} className="max-w-[460px]" noValidate={false}>
      <div className="flex h-14">
        <input
          ref={inputRef}
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@yourleague.com"
          aria-label="Email address"
          aria-invalid={status === "error"}
          aria-describedby="email-helper"
          className={`min-w-0 flex-1 rounded-l-[9px] border border-r-0 px-[18px] font-mono text-[15px] outline-none focus:border-wrapped ${inputBase} ${status === "error" ? "!border-regret" : ""}`}
        />
        <input
          type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden
          value={company} onChange={(e) => setCompany(e.target.value)}
          className="absolute -left-[9999px] size-0 opacity-0"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className={`w-[130px] rounded-r-[9px] font-mono text-xs font-medium uppercase tracking-[0.18em] transition-colors disabled:opacity-70 ${light ? "bg-field text-chalk hover:bg-[#1c1c21]" : "bg-wrapped text-[#0B0B12] hover:bg-signal-hover"}`}
        >
          {status === "loading" ? "…" : "Get access"}
        </button>
      </div>
      <p id="email-helper" role={status === "error" ? "alert" : undefined} className={`mt-3 text-[13px] ${status === "error" ? "text-regret" : "text-[#5D5D6B]"}`}>
        {status === "error" ? error : "We’ll email less often than you check waivers."}
      </p>
    </form>
  );
}
```
- [ ] **Step 4: Run tests** → PASS. Then `pnpm lint && pnpm typecheck`.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add EmailCapture with loading, success, error and honeypot"
```

---

### Task 6: StoryCardStack

**Files:**
- Create: `src/components/story-card-stack.tsx`
- Test: `tests/unit/story-card-stack.test.tsx`

**Interfaces:**
- Produces: `StoryCardStack()` (client). Root `<button>` has `data-active-index` (0-2) and `aria-label="Next story card"`. Constants exported: `CARD_MS = 4000`.

- [ ] **Step 1: Write failing tests (fake timers)**

`tests/unit/story-card-stack.test.tsx`:
```tsx
// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CARD_MS, StoryCardStack } from "@/components/story-card-stack";

const idx = () => screen.getByRole("button", { name: /next story card/i }).getAttribute("data-active-index");

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("StoryCardStack", () => {
  it("starts on card 0 and auto-advances every 4s, wrapping 2 -> 0", () => {
    render(<StoryCardStack />);
    expect(idx()).toBe("0");
    act(() => { vi.advanceTimersByTime(CARD_MS); });
    expect(idx()).toBe("1");
    act(() => { vi.advanceTimersByTime(CARD_MS); });
    expect(idx()).toBe("2");
    act(() => { vi.advanceTimersByTime(CARD_MS); });
    expect(idx()).toBe("0");
  });

  it("click advances immediately and resets the timer", () => {
    render(<StoryCardStack />);
    act(() => { vi.advanceTimersByTime(3000); });
    fireEvent.click(screen.getByRole("button", { name: /next story card/i }));
    expect(idx()).toBe("1");
    act(() => { vi.advanceTimersByTime(3000); });
    expect(idx()).toBe("1");
    act(() => { vi.advanceTimersByTime(1000); });
    expect(idx()).toBe("2");
  });

  it("rapid clicks advance one card each and wrap", () => {
    render(<StoryCardStack />);
    const b = screen.getByRole("button", { name: /next story card/i });
    fireEvent.click(b); fireEvent.click(b); fireEvent.click(b);
    expect(idx()).toBe("0");
  });

  it("pauses on hover without resetting progress", () => {
    render(<StoryCardStack />);
    const b = screen.getByRole("button", { name: /next story card/i });
    act(() => { vi.advanceTimersByTime(3000); });
    fireEvent.mouseEnter(b);
    act(() => { vi.advanceTimersByTime(10000); });
    expect(idx()).toBe("0");
    fireEvent.mouseLeave(b);
    act(() => { vi.advanceTimersByTime(1000); });
    expect(idx()).toBe("1");
  });

  it("pauses while the tab is hidden and resumes without skipping", () => {
    render(<StoryCardStack />);
    act(() => { vi.advanceTimersByTime(3000); });
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); vi.advanceTimersByTime(10000); });
    expect(idx()).toBe("0");
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    act(() => { document.dispatchEvent(new Event("visibilitychange")); vi.advanceTimersByTime(1000); });
    expect(idx()).toBe("1");
  });

  it("does not auto-advance under prefers-reduced-motion but still advances on click", () => {
    window.matchMedia = vi.fn().mockImplementation((q: string) => ({
      matches: q.includes("reduce"), media: q, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })) as unknown as typeof window.matchMedia;
    render(<StoryCardStack />);
    act(() => { vi.advanceTimersByTime(20000); });
    expect(idx()).toBe("0");
    fireEvent.click(screen.getByRole("button", { name: /next story card/i }));
    expect(idx()).toBe("1");
  });
});
```
- [ ] **Step 2: Run to verify fail** → FAIL.

- [ ] **Step 3: Implement**

`src/components/story-card-stack.tsx`:
```tsx
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

export const CARD_MS = 4000;
const TICK_MS = 100;

const CARDS = [
  { theme: "dark", kicker: "BENCH REGRET", kickerColor: "#FF4A31", stat: "4-10", statColor: "#FAFAFA",
    headline: "Six wins, still on your bench.",
    body: "Start the right players and you go 10-4. The roster was never the problem.",
    footer: "FANTASY·WRAPPED — 2025" },
  { theme: "dark", kicker: "WAIVER STEAL · WEEK 3", kickerColor: "#5B8CFF", stat: "245.6", statColor: "#5B8CFF",
    headline: "Everyone else scrolled past Drake Maye.",
    body: "Points after you claimed him. Free.",
    footer: "FANTASY·WRAPPED — 2025" },
  { theme: "paper", kicker: "YOUR ARCHETYPE", kickerColor: "#2148D8", stat: null, statColor: "",
    headline: "The Saboteur",
    body: "504.6 points died on your bench and 6 losses were already wins. Nobody in this league beat you like you did.",
    footer: "SCREENSHOT THIS →" },
] as const;

function useReducedMotionPref() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return reduced;
}

export function StoryCardStack() {
  const [index, setIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const reduced = useReducedMotionPref();

  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const running = !hovered && !hidden && !reduced;

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setElapsed((e) => {
        const next = e + TICK_MS;
        if (next >= CARD_MS) { setIndex((i) => (i + 1) % CARDS.length); return 0; }
        return next;
      });
    }, TICK_MS);
    return () => clearInterval(t);
  }, [running]);

  function advance() {
    setIndex((i) => (i + 1) % CARDS.length);
    setElapsed(0);
  }

  const card = CARDS[index];
  const paper = card.theme === "paper";
  return (
    <div className="relative mx-auto aspect-[9/16] w-[min(340px,80vw)]">
      <div aria-hidden className="absolute inset-0 rounded-[26px] bg-raised" style={{ transform: "rotate(6deg) translate(34px, 8px)" }} />
      <div aria-hidden className="absolute inset-0 rounded-[26px] bg-raised-2" style={{ transform: "rotate(-4deg) translate(-26px, 4px)" }} />
      <button
        type="button"
        aria-label="Next story card"
        data-active-index={index}
        onClick={advance}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative flex size-full cursor-pointer flex-col justify-between overflow-hidden rounded-[26px] px-7 pb-7 pt-14 text-left shadow-[0_40px_120px_-20px_rgba(0,0,0,0.8)] ${paper ? "bg-chalk text-field" : "bg-field text-chalk"}`}
      >
        <div className="absolute inset-x-[18px] top-[18px] flex gap-[5px]" aria-hidden>
          {CARDS.map((_, i) => (
            <div key={i} className="h-[3px] flex-1 overflow-hidden rounded-full" style={{ background: paper ? "#0A0A0B22" : "#FFFFFF33" }}>
              <div
                className="h-full origin-left"
                style={{
                  background: paper ? "#0A0A0B" : "#FAFAFA",
                  transform: `scaleX(${i < index ? 1 : i === index ? elapsed / CARD_MS : 0})`,
                }}
              />
            </div>
          ))}
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0, y: reduced ? 0 : 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex size-full flex-col justify-between"
          >
            <div className="font-mono text-[11px] font-medium uppercase tracking-[0.2em]" style={{ color: card.kickerColor }}>{card.kicker}</div>
            <div>
              {card.stat && (
                <div className="mb-3 font-mono text-[88px] font-medium leading-[0.9] tracking-[-0.04em]" style={{ color: card.statColor }}>{card.stat}</div>
              )}
              <div className={`font-semibold ${card.stat ? "text-[40px] leading-[0.98] tracking-[-0.04em]" : "text-[64px] leading-[0.85] tracking-[-0.055em]"}`}>{card.headline}</div>
              <p className={`mt-4 text-[15px] leading-[1.45] ${paper ? "text-chalk-muted" : "text-chalk-dim"}`}>{card.body}</p>
            </div>
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-chalk-muted">{card.footer}</div>
          </motion.div>
        </AnimatePresence>
      </button>
    </div>
  );
}
```
Timing note: `mode="wait"` keeps the old card visible during the 300ms exit; the index state changes immediately, which is what the tests assert.

- [ ] **Step 4: Run tests** → `pnpm test tests/unit/story-card-stack.test.tsx` PASS. If the reduced-motion test fails because `mq.addEventListener` is absent in the mock, the code already uses optional calls; verify the mock returns `matches: true` for the `reduce` query.

- [ ] **Step 5: Lint, typecheck, commit**

```bash
pnpm lint && pnpm typecheck && git add -A && git commit -m "feat: add StoryCardStack with pause, hidden-tab and reduced-motion handling"
```

---

### Task 7: Nav, Hero, ToolCards, Footer, page assembly

**Files:**
- Create: `src/components/nav.tsx`, `hero.tsx`, `tool-cards.tsx`, `footer.tsx`
- Modify: `src/app/page.tsx`
- Test: `tests/unit/page.test.tsx`

**Interfaces:**
- Consumes: `Wordmark`, `EmailCapture` (`id="signup"`), `StoryCardStack`, `TOOL_URL`.
- Produces: `Home` page. Hedge "Notify me" is a `<button>` that dispatches `new CustomEvent("fantasy:source", { detail: "hedge" })` then scrolls `#signup` into view (`ToolCards` is a client component for this handler only; keep it small by putting the button in a tiny `NotifyButton` client file `src/components/notify-button.tsx`).

- [ ] **Step 1: Write failing page test**

`tests/unit/page.test.tsx`:
```tsx
// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Home from "@/app/page";

describe("Home", () => {
  it("renders hero copy and all three tools with correct destinations", () => {
    render(<Home />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("It's all on the record");
    const tools = screen.getByRole("region", { name: "Tools" });
    const wrapped = within(tools).getByRole("link", { name: /wrapped/i });
    expect(wrapped).toHaveAttribute("href", "https://fantasywrapped.net");
    const rankings = within(tools).getByRole("link", { name: /rankings/i });
    expect(rankings).toHaveAttribute("href", "https://fantasy-rankings-beige.vercel.app");
    expect(within(tools).getByRole("button", { name: /hedge/i })).toBeInTheDocument();
  });

  it("has the footer lines verbatim", () => {
    render(<Home />);
    expect(screen.getByText("FANTASY · 2026")).toBeInTheDocument();
    expect(screen.getByText("NOT AFFILIATED WITH THE NFL")).toBeInTheDocument();
  });

  it("contains no exclamation marks in visible copy", () => {
    const { container } = render(<Home />);
    expect(container.textContent).not.toContain("!");
  });
});
```
- [ ] **Step 2: Run to verify fail** → FAIL.

- [ ] **Step 3: Implement components**

`src/components/nav.tsx`:
```tsx
import { Wordmark } from "./wordmark";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-[#060607e6] backdrop-blur-[12px]">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-[22px] md:px-12" aria-label="Primary">
        <a href="#" aria-label="fantasy home"><Wordmark size={24} /></a>
        <div className="flex items-center gap-7 text-sm">
          <a href="#tools" className="hidden text-chalk-dim hover:text-wrapped sm:inline">Wrapped</a>
          <a href="#tools" className="hidden text-chalk-dim hover:text-wrapped sm:inline">Rankings</a>
          <a href="#tools" className="hidden text-chalk-dim hover:text-wrapped sm:inline">Hedge</a>
          <a href="#signup" className="inline-flex min-h-11 items-center rounded-[9px] bg-chalk px-4 font-semibold text-field">Get early access</a>
        </div>
      </nav>
    </header>
  );
}
```
`src/components/hero.tsx`:
```tsx
import { EmailCapture } from "./email-capture";
import { StoryCardStack } from "./story-card-stack";

export function Hero() {
  return (
    <section className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 pb-24 pt-[72px] md:px-12 min-[900px]:grid-cols-[1.15fr_1fr]">
      <div className="flex flex-col gap-7">
        <div className="font-mono text-xs font-medium uppercase tracking-[0.24em] text-chalk-faint">We watched every week</div>
        <h1 className="font-semibold leading-[0.86] tracking-[-0.058em]" style={{ fontSize: "clamp(56px, 10vw, 112px)" }}>
          It&apos;s all on the record
          <span aria-hidden className="ml-[0.02em] inline-block rounded-full bg-wrapped align-baseline" style={{ width: "0.17em", height: "0.17em" }} />
        </h1>
        <p className="max-w-[500px] text-xl leading-[1.5] text-chalk-dim">
          Fantasy football tools that remember what you&apos;d rather forget. The receipts are on the right. Tap them.
        </p>
        <EmailCapture id="signup" />
      </div>
      <div className="pb-6 pt-2"><StoryCardStack /></div>
    </section>
  );
}
```
`src/components/notify-button.tsx`:
```tsx
"use client";

export function NotifyButton({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        window.dispatchEvent(new CustomEvent("fantasy:source", { detail: "hedge" }));
        document.getElementById("signup")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }}
    >
      {children}
    </button>
  );
}
```
`src/components/tool-cards.tsx`:
```tsx
import { NotifyButton } from "./notify-button";
import { Wordmark } from "./wordmark";
import { TOOL_URL } from "@/lib/tools";

const cardBase = "group flex flex-col overflow-hidden rounded-[18px] border border-hairline bg-surface-2 text-left transition-colors hover:border-hairline-2";
const preview = "flex h-[200px] items-center justify-center border-b border-hairline bg-field";
const body = "flex flex-col gap-[10px] p-[22px]";
const meta = "font-mono text-[11px] font-medium uppercase tracking-[0.16em]";

function WrappedPreview() {
  return (
    <div className={`${preview} gap-3`} aria-hidden>
      <div className="flex h-[164px] w-[92px] flex-col justify-between rounded-[10px] bg-raised p-2.5">
        <span className="font-mono text-[7px] tracking-[0.16em] text-regret">BENCH REGRET</span>
        <div>
          <div className="font-mono text-[26px] leading-none tracking-[-0.04em]">4-10</div>
          <div className="mt-1 text-[9px] font-semibold leading-tight">Six wins, still on your bench.</div>
        </div>
      </div>
      <div className="flex h-[164px] w-[92px] flex-col justify-between rounded-[10px] bg-chalk p-2.5 text-field">
        <span className="font-mono text-[7px] tracking-[0.16em] text-signal-on-light">ARCHETYPE</span>
        <div className="text-[20px] font-semibold leading-[0.85] tracking-[-0.055em]">The Saboteur</div>
      </div>
    </div>
  );
}

function RankingsPreview() {
  const rows = [["1", "Ja'Marr Chase", "CIN WR"], ["2", "Bijan Robinson", "ATL RB"], ["3", "Jahmyr Gibbs", "DET RB"]];
  return (
    <div className={`${preview} px-8`} aria-hidden>
      <div className="w-full max-w-[250px]">
        <div className="mb-2 font-mono text-[10px] tracking-[0.18em] text-rankings">TIER 1</div>
        {rows.map(([n, name, m]) => (
          <div key={n} className="flex items-baseline border-b border-hairline py-2 text-[13px]">
            <span className="w-7 font-mono text-chalk-muted">{n}</span>
            <span className="flex-1 font-semibold">{name}</span>
            <span className="font-mono text-[10px] text-chalk-faint">{m}</span>
          </div>
        ))}
        <div className="mt-2 font-mono text-[10px] tracking-[0.18em] text-chalk-faintest">TIER 2</div>
      </div>
    </div>
  );
}

function HedgePreview() {
  return (
    <div className={preview} aria-hidden>
      <div className="w-[250px] rounded-xl border border-[#2A2A31] bg-raised-2 p-4">
        <div className="font-mono text-[10px] tracking-[0.18em] text-hedge">INJURY PROTECTION</div>
        <div className="mt-2 text-[17px] font-semibold leading-tight">Bijan misses 2+ games</div>
        <div className="mt-4 flex justify-between font-mono text-[11px] text-hedge">
          <span>COST 140</span><span>PAYS 1,000</span>
        </div>
      </div>
    </div>
  );
}

export function ToolCards() {
  return (
    <section id="tools" aria-label="Tools" className="mx-auto max-w-[1200px] px-6 pb-24 md:px-12">
      <div className="grid gap-4 min-[900px]:grid-cols-3">
        <a href={TOOL_URL.wrapped} className={cardBase} aria-label="fantasy wrapped, live, open">
          <WrappedPreview />
          <div className={body}>
            <Wordmark size={26} tool="wrapped" letterSpacing="-0.045em" />
            <p className="text-[15px] leading-[1.45] text-chalk-dim">Your season, told back to you with precision and a little cruelty.</p>
            <span className={`${meta} text-wrapped`}>LIVE · OPEN →</span>
          </div>
        </a>
        <a href={TOOL_URL.rankings} className={cardBase} aria-label="fantasy rankings, beta, join">
          <RankingsPreview />
          <div className={body}>
            <Wordmark size={26} tool="rankings" letterSpacing="-0.045em" />
            <p className="text-[15px] leading-[1.45] text-chalk-dim">A board you can read with forty seconds on the clock.</p>
            <span className={`${meta} text-rankings`}>BETA · JOIN →</span>
          </div>
        </a>
        <NotifyButton className={`${cardBase} cursor-pointer`}>
          <span className="sr-only">fantasy hedge, in development, notify me</span>
          <HedgePreview />
          <span className={body} aria-hidden>
            <Wordmark size={26} tool="hedge" letterSpacing="-0.045em" />
            <span className="text-[15px] leading-[1.45] text-chalk-dim">Insure your roster against the NFL. Virtual coins, real anxiety.</span>
            <span className={`${meta} text-hedge`}>IN DEVELOPMENT · NOTIFY ME →</span>
          </span>
        </NotifyButton>
      </div>
    </section>
  );
}
```
Note: the Hedge card is a `<button>` so its accessible name comes from the `sr-only` text, which the test matches with `/hedge/i`.
`src/components/footer.tsx`:
```tsx
export function Footer() {
  return (
    <footer className="border-t border-[#16161A]">
      <div className="mx-auto flex max-w-[1200px] flex-wrap justify-between gap-2 px-6 py-6 font-mono text-[11px] uppercase tracking-[0.16em] text-chalk-muted md:px-12">
        <span>FANTASY · 2026</span>
        <span>NOT AFFILIATED WITH THE NFL</span>
      </div>
    </footer>
  );
}
```
`src/app/page.tsx`:
```tsx
import { Footer } from "@/components/footer";
import { Hero } from "@/components/hero";
import { Nav } from "@/components/nav";
import { ToolCards } from "@/components/tool-cards";

export default function Home() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <ToolCards />
      </main>
      <Footer />
    </>
  );
}
```
- [ ] **Step 4: Run tests** → `pnpm test tests/unit/page.test.tsx` PASS. Then the full suite `pnpm test`.

- [ ] **Step 5: Visual check against the handoff**

Run `pnpm dev`, open `http://localhost:3000` at 1280px and 375px next to `Fantasy Homepage v2.dc.html` (artboard 2a) opened in a browser. Fix visible deviations (spacing, sizes, colors) until they match. Confirm no horizontal scroll at 375px via `document.documentElement.scrollWidth <= innerWidth` in the console.

- [ ] **Step 6: Lint, typecheck, build, commit**

```bash
pnpm lint && pnpm typecheck && pnpm build && git add -A && git commit -m "feat: assemble homepage with nav, hero, tool cards and footer"
```

---

### Task 8: Icons and OG image

**Files:**
- Create: `src/app/icon.tsx`, `src/app/apple-icon.tsx`, `src/app/opengraph-image.tsx`, `src/assets/Geist-SemiBold.ttf`
- Test: `tests/unit/og-routes.test.ts`

**Interfaces:**
- Produces: `/icon` (32x32 png), `/apple-icon` (180x180), `/opengraph-image` (1200x630); each default export is a function returning an `ImageResponse`.

- [ ] **Step 1: Write failing test**

`tests/unit/og-routes.test.ts`:
```ts
import { describe, expect, it } from "vitest";

describe("icon and og routes", () => {
  it("exports the expected sizes and content types", async () => {
    const icon = await import("@/app/icon");
    const apple = await import("@/app/apple-icon");
    const og = await import("@/app/opengraph-image");
    expect(icon.size).toEqual({ width: 32, height: 32 });
    expect(apple.size).toEqual({ width: 180, height: 180 });
    expect(og.size).toEqual({ width: 1200, height: 630 });
    for (const m of [icon, apple, og]) expect(m.contentType).toBe("image/png");
  });

  it("renders a non-empty PNG for each route", async () => {
    for (const path of ["@/app/icon", "@/app/apple-icon", "@/app/opengraph-image"]) {
      const mod = await import(path);
      const res = await mod.default();
      const buf = new Uint8Array(await res.arrayBuffer());
      expect(buf.length).toBeGreaterThan(500);
      expect(Array.from(buf.slice(1, 4))).toEqual([0x50, 0x4e, 0x47]);
    }
  });
});
```
- [ ] **Step 2: Run to verify fail** → FAIL. (`next/og` works under Node in Vitest; if it does not, switch this test's environment to `node` via `// @vitest-environment node` at the top.)

- [ ] **Step 3: Copy the Geist font and implement**

```bash
pnpm add -D geist
mkdir -p src/assets
cp "$(find node_modules/geist -name 'Geist-SemiBold.ttf' | head -1)" src/assets/Geist-SemiBold.ttf
test -s src/assets/Geist-SemiBold.ttf
pnpm remove geist
```
Expected: the `test -s` succeeds. If no `Geist-SemiBold.ttf` is found, list `node_modules/geist/dist/fonts` and use the semibold file that exists.
`src/app/icon.tsx`:
```tsx
import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div style={{ width: 32, height: 32, background: "#5B8CFF", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 9, height: 9, borderRadius: 9, background: "#0A0A0B" }} />
      </div>
    ),
    size,
  );
}
```
`src/app/apple-icon.tsx`:
```tsx
import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#5B8CFF", borderRadius: 42, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ width: 50, height: 50, borderRadius: 50, background: "#0A0A0B" }} />
      </div>
    ),
    size,
  );
}
```
`src/app/opengraph-image.tsx`:
```tsx
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "fantasy. Your league, measured.";

export default async function OG() {
  const font = await readFile(join(process.cwd(), "src/assets/Geist-SemiBold.ttf"));
  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, background: "#060607", color: "#FAFAFA", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 72, fontFamily: "Geist" }}>
        <div style={{ display: "flex", alignItems: "baseline", fontSize: 56, letterSpacing: "-0.05em", fontWeight: 600 }}>
          fantasy
          <div style={{ width: 11, height: 11, borderRadius: 11, background: "#5B8CFF", marginLeft: 3 }} />
        </div>
        <div style={{ fontSize: 112, lineHeight: 0.9, letterSpacing: "-0.055em", fontWeight: 600, display: "flex" }}>Your league, measured.</div>
        <div style={{ fontSize: 22, letterSpacing: "0.22em", color: "#71717A", display: "flex" }}>WRAPPED · RANKINGS · HEDGE</div>
      </div>
    ),
    { ...size, fonts: [{ name: "Geist", data: font, weight: 600, style: "normal" }] },
  );
}
```
Vercel file tracing: add to `next.config.ts` `outputFileTracingIncludes: { "/opengraph-image": ["./src/assets/**"] }`.
- [ ] **Step 4: Run tests** → PASS. Then `pnpm build` and confirm `/opengraph-image` and `/icon` appear in the route list.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat: add favicon, apple icon and parent OG image"
```

---

### Task 9: Playwright E2E and CI

**Files:**
- Create: `playwright.config.ts`, `tests/e2e/home.spec.ts`, `.github/workflows/ci.yml`
- Modify: `package.json` (`"e2e": "playwright test"`)

**Interfaces:**
- Consumes: the built app on port 3100.

- [ ] **Step 1: Write the E2E spec (fails until config exists)**

`tests/e2e/home.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

for (const vp of [{ name: "mobile", width: 375, height: 812 }, { name: "desktop", width: 1280, height: 800 }]) {
  test.describe(vp.name, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test("renders sections and has no horizontal scroll", async ({ page }) => {
      await page.goto("/");
      await expect(page.getByRole("heading", { level: 1 })).toContainText("It's all on the record");
      await expect(page.getByRole("region", { name: "Tools" })).toBeVisible();
      await expect(page.getByText("NOT AFFILIATED WITH THE NFL")).toBeVisible();
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow).toBeLessThanOrEqual(0);
    });

    test("email signup success path", async ({ page }) => {
      await page.route("**/api/subscribe", (r) => r.fulfill({ json: { ok: true } }));
      await page.goto("/");
      await page.getByPlaceholder("you@yourleague.com").fill("a@b.co");
      await page.getByRole("button", { name: /get access/i }).click();
      await expect(page.getByText("You're on the list. We'll keep it brief.")).toBeVisible();
    });

    test("hedge card tags the signup and focuses the form", async ({ page }) => {
      let body = "";
      await page.route("**/api/subscribe", async (r) => { body = r.request().postData() ?? ""; await r.fulfill({ json: { ok: true } }); });
      await page.goto("/");
      await page.getByRole("button", { name: /hedge/i }).click();
      await page.getByPlaceholder("you@yourleague.com").fill("a@b.co");
      await page.getByRole("button", { name: /get access/i }).click();
      await expect(page.getByText(/on the list/i)).toBeVisible();
      expect(JSON.parse(body).source).toBe("hedge");
    });
  });
}
```
- [ ] **Step 2: Add config, install browsers, run**

`playwright.config.ts`:
```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  use: { baseURL: "http://localhost:3100" },
  webServer: { command: "pnpm build && pnpm start -p 3100", url: "http://localhost:3100", reuseExistingServer: !process.env.CI, timeout: 240_000 },
});
```
Run: `pnpm exec playwright install chromium && pnpm e2e` → Expected: 6 passed. Vitest must not pick up e2e files (its `include` only covers `tests/unit` and `tests/integration`).

- [ ] **Step 3: CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm e2e
```
`pnpm/action-setup` reads the version from `packageManager` in `package.json`; set it with `pnpm pkg set packageManager="pnpm@$(pnpm -v)"`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "test: add Playwright e2e and CI workflow"
```

---

### Task 10: Delivery (GitHub, Vercel, Neon, PR, memory)

**Files:**
- Modify: none in source; external resources and memory files.

**Interfaces:**
- Consumes: passing `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e`.
- Produces: public repo `nardonef/fantasy`, Vercel project linked to it, Neon database with `DATABASE_URL` set for Production and Preview, draft PR, preview URL verified.

- [ ] **Step 1: Full local verification**

Run: `pnpm lint && pnpm typecheck && pnpm test && pnpm e2e && pnpm build` → Expected: all pass. Do not proceed on any failure.

- [ ] **Step 2: Create the public GitHub repo and push the feature branch (never `main` force-push)**

```bash
gh repo create nardonef/fantasy --public --source=. --remote=origin --description "fantasy. parent site"
git push -u origin feat/site
```
Expected: repo exists at `https://github.com/nardonef/fantasy` with `feat/site` pushed. A PR needs a base branch on the remote. `main` currently holds only the empty "Initial commit". Pushing it is a push to `main`, so ask the user to approve it explicitly (or to create `main` from the GitHub UI), then run `git push origin main` only after they say yes. Never push feature work to `main`.

- [ ] **Step 3: Link Vercel via GitHub integration**

Use `vercel link` (the user's Vercel team) or the Vercel MCP `create_git_project` with the repo; framework preset Next.js, pnpm. Verify with `mcp__plugin_vercel_vercel__get_project` that the project shows the git repo `nardonef/fantasy` and production branch `main`.

- [ ] **Step 4: Provision Neon (BILLABLE: confirm with the user first)**

Ask the user to confirm creating a Neon database via the Vercel Marketplace (`vercel integration add neon` or the dashboard). After approval, verify `DATABASE_URL` exists for Production and Preview (`vercel env ls`). Do not print its value. Pull it locally: `vercel env pull .env.local`.

- [ ] **Step 5: Run the migration and the real-DB integration test**

```bash
pnpm db:migrate
TEST_DATABASE_URL="$(grep ^DATABASE_URL= .env.local | cut -d= -f2- | tr -d '"')" pnpm test tests/integration
```
Expected: 1 passed (not skipped). If it skips, `TEST_DATABASE_URL` was not set. Fix and rerun.

- [ ] **Step 6: Open the draft PR and verify the preview**

```bash
gh pr create --draft --base main --head feat/site --title "Build fantasy. parent site (concept 2a)" --body "Implements docs/superpowers/specs/2026-09-28-fantasy-site-design.md"
```
Wait for the Vercel preview and the CI check. Fetch the preview URL with `mcp__plugin_vercel_vercel__get_deployment` (if protected, use `web_fetch_vercel_url`). Verify in a browser: page renders, story card advances, Hedge card tags the form, a real signup returns 200 and the row appears in Neon, a duplicate returns success with still one row. Delete test rows afterward.

- [ ] **Step 7: Update memory (final step per user's global rule)**

Write `project` memory `fantasy-parent-site` in the user's Claude Code project memory directory (repo, stack, tool URLs, Neon signups table, deploy flow, spec and plan paths, what remains: custom domain, Wrapped share OG) and add its one-line pointer to `MEMORY.md`. Report the PR URL and preview URL to the user.

---

## Self-Review

**Spec coverage:** structure, Wordmark (Task 2), subscribe + rate limit + honeypot + dedupe + generic errors (Tasks 3-4), EmailCapture states/error/success/honeypot (Task 5), story card timing/pause/hidden/reduced motion (Task 6), nav/hero/tool cards/footer/Hedge tagging/tool URLs (Task 7), icons + parent OG (Task 8), responsive + E2E at 375/1280 (Tasks 7, 9), CI lint/typecheck (Task 9), delivery, Neon confirmation, memory (Task 10). Wrapped share OG, 2b/2c, analytics and custom domain are out of scope per spec.

**Types consistent:** `Source`, `SubscribeDeps`, `SubscribeResult`, `handleSubscribe`, `createRateLimiter`, `insertSignup`, `CARD_MS`, `TOOL_URL`, `TOOL_COLOR` are used with the same names across tasks. The `fantasy:source` event name matches in `EmailCapture` and `NotifyButton`.

**Known judgment calls to flag to the reviewer:** the in-memory rate limiter is per-instance (spec-accepted); the 429 response is an addition implied by the spec's rate-limit requirement; exact preview-card pixel values (mini card fonts) are approximations checked visually in Task 7 Step 5 against the handoff.
