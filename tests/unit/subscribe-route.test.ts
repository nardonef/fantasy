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
