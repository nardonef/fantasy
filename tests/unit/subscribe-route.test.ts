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

  it("429 on the sixth request when only the leftmost x-forwarded-for entry is forged", async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 6; i++) {
      statuses.push((await post(JSON.stringify({ email: `f${i}@b.co` }), { "x-forwarded-for": `10.0.0.${i}, 8.8.8.8` })).status);
    }
    expect(statuses.slice(0, 5)).toEqual([200, 200, 200, 200, 200]);
    expect(statuses[5]).toBe(429);
  });

  it("counts different x-vercel-forwarded-for values separately", async () => {
    for (let i = 0; i < 5; i++) {
      expect((await post(JSON.stringify({ email: `a${i}@b.co` }), { "x-vercel-forwarded-for": "4.4.4.4" })).status).toBe(200);
    }
    expect((await post(JSON.stringify({ email: "a5@b.co" }), { "x-vercel-forwarded-for": "4.4.4.4" })).status).toBe(429);
    expect((await post(JSON.stringify({ email: "b0@b.co" }), { "x-vercel-forwarded-for": "5.5.5.5" })).status).toBe(200);
  });
});
