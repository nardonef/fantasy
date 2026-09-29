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
      expect(buf.length).toBeGreaterThan(100);
      expect(Array.from(buf.slice(1, 4))).toEqual([0x50, 0x4e, 0x47]);
    }
  });
});
