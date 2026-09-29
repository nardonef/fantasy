// @vitest-environment node
import { describe, expect, it } from "vitest";
import { clientIp } from "@/lib/client-ip";

const h = (o: Record<string, string>) => new Headers(o);

describe("clientIp", () => {
  it("prefers x-vercel-forwarded-for", () => {
    expect(clientIp(h({ "x-vercel-forwarded-for": " 9.9.9.9 ", "x-real-ip": "2.2.2.2", "x-forwarded-for": "3.3.3.3" }))).toBe("9.9.9.9");
  });
  it("then x-real-ip", () => {
    expect(clientIp(h({ "x-real-ip": " 2.2.2.2 ", "x-forwarded-for": "3.3.3.3" }))).toBe("2.2.2.2");
  });
  it("then the rightmost x-forwarded-for entry", () => {
    expect(clientIp(h({ "x-forwarded-for": "6.6.6.6, 7.7.7.7, 3.3.3.3" }))).toBe("3.3.3.3");
  });
  it("uses the only entry of a single-entry x-forwarded-for", () => {
    expect(clientIp(h({ "x-forwarded-for": "3.3.3.3" }))).toBe("3.3.3.3");
  });
  it("ignores whitespace and empty entries", () => {
    expect(clientIp(h({ "x-forwarded-for": "6.6.6.6, 3.3.3.3 , ,  " }))).toBe("3.3.3.3");
    expect(clientIp(h({ "x-vercel-forwarded-for": "   ", "x-real-ip": " ", "x-forwarded-for": " , " }))).toBe("unknown");
  });
  it("returns unknown when nothing is present", () => {
    expect(clientIp(h({}))).toBe("unknown");
  });
});
