import { insertSignup } from "@/db";
import { createRateLimiter } from "@/lib/rate-limit";
import { handleSubscribe } from "@/lib/subscribe";

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!limiter.check(ip)) {
    return Response.json({ error: "Too many attempts. Try again in a few minutes." }, { status: 429 });
  }
  let body: unknown = null;
  try { body = await req.json(); } catch { /* falls through to 400 via schema */ }
  const result = await handleSubscribe(body, { insert: insertSignup });
  if (result.ok) return Response.json({ ok: true });
  return Response.json({ error: result.error }, { status: result.status });
}
