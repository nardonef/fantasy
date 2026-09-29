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
