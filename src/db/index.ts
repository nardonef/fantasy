import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { signups } from "./schema";

export function getDb() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  return drizzle(neon(url));
}

export async function insertSignup(email: string, source: string) {
  await getDb().insert(signups).values({ email, source }).onConflictDoNothing({ target: signups.email });
}
