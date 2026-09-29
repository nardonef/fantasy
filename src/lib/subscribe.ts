import { z } from "zod";

export const SOURCES = ["hero", "wrapped", "rankings", "hedge"] as const;
export type Source = (typeof SOURCES)[number];

export type SubscribeDeps = { insert: (email: string, source: Source) => Promise<void> };
export type SubscribeResult = { ok: true } | { ok: false; status: 400 | 500; error: string };

const schema = z.object({
  email: z.string().trim().toLowerCase().max(254).pipe(z.email()),
  source: z.enum(SOURCES).default("hero"),
  hp_x: z.string().optional(),
});

export async function handleSubscribe(body: unknown, deps: SubscribeDeps): Promise<SubscribeResult> {
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { ok: false, status: 400, error: "Enter a valid email address." };
  const { email, source, hp_x } = parsed.data;
  if (hp_x) return { ok: true };
  try {
    await deps.insert(email, source);
    return { ok: true };
  } catch (err) {
    console.error("subscribe insert failed", err);
    return { ok: false, status: 500, error: "Something broke on our end. Try again." };
  }
}
