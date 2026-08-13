import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDb(databaseUrl = process.env.DATABASE_URL) {
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not configured. Connect the Neon project or add the pooled connection string to the local environment."
    );
  }

  return drizzle(neon(databaseUrl), { schema });
}

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}
