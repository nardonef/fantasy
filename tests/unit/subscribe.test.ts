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
