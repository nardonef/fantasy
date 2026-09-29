import { defineConfig } from "drizzle-kit";

const url = process.env.DATABASE_URL;
// `drizzle-kit generate` needs no database; only `migrate` does.
if (!url && process.argv.includes("migrate")) {
  throw new Error("DATABASE_URL is not set. Put it in .env.local (see .env.example).");
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: url ?? "" },
});
