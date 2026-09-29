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
