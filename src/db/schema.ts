import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const signups = pgTable("signups", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  source: text("source").notNull().default("hero"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
