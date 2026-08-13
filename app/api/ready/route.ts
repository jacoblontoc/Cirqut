import { sql } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db";
import { isAuthConfigured } from "@/lib/auth/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!isDatabaseConfigured() || !isAuthConfigured()) {
    return Response.json(
      { status: "not_ready" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    await getDb().execute(sql`select 1 as ok`);
    return Response.json(
      { status: "ready" },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return Response.json(
      { status: "not_ready" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
