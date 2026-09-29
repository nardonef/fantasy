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
