/**
 * Derive the rate-limit key from headers a client cannot forge.
 * Prefers x-vercel-forwarded-for, then x-real-ip, then the rightmost
 * x-forwarded-for entry (appended by the nearest trusted proxy).
 */
export function clientIp(headers: Headers): string {
  const vercel = headers.get("x-vercel-forwarded-for")?.trim();
  if (vercel) return vercel;
  const real = headers.get("x-real-ip")?.trim();
  if (real) return real;
  const entries = (headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return entries[entries.length - 1] ?? "unknown";
}
