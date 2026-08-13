import { sql } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db";
import { isAuthConfigured } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  let database: "connected" | "unconfigured" | "unavailable" = "unconfigured";

  if (isDatabaseConfigured()) {
    try {
      await getDb().execute(sql`select 1 as ok`);
      database = "connected";
    } catch {
      database = "unavailable";
    }
  }

  return Response.json(
    {
      status: "ok",
      services: {
        database,
        authentication: isAuthConfigured() ? "configured" : "unconfigured",
      },
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
