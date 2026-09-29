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

  describe("maxKeys bound", () => {
    it("never exceeds maxKeys with distinct live keys", () => {
      const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0, maxKeys: 3 });
      for (let i = 0; i < 5; i++) {
        expect(rl.check(`k${i}`)).toBe(true);
        expect(rl.size()).toBeLessThanOrEqual(3);
      }
      expect(rl.size()).toBe(3);
    });
    it("sweeps expired keys before evicting", () => {
      let t = 0;
      const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: () => t, maxKeys: 3 });
      rl.check("a"); rl.check("b"); rl.check("c");
      expect(rl.size()).toBe(3);
      t = 1001;
      expect(rl.check("d")).toBe(true);
      expect(rl.size()).toBe(1);
    });
    it("evicts the oldest-inserted live key without wrongly blocking a new key", () => {
      const rl = createRateLimiter({ limit: 1, windowMs: 1000, now: () => 0, maxKeys: 2 });
      rl.check("a"); rl.check("b");
      expect(rl.check("c")).toBe(true);
      expect(rl.size()).toBe(2);
      expect(rl.check("d")).toBe(true);
      expect(rl.check("d")).toBe(false);
    });
  });
});
