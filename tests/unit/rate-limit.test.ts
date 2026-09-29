import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows up to limit within the window then blocks", () => {
    const t = 0;
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
