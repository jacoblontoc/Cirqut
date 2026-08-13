import { getDb, isDatabaseConfigured } from "@/db";
import { waitlistEntries } from "@/db/schema";
import {
  hasHoneypotValue,
  isAllowedFormOrigin,
  parseWaitlistInput,
} from "@/lib/public-forms";

const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) {
    return Response.json({ error: "Request origin is not allowed." }, { status: 403, headers });
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return Response.json({ error: "Request is too large." }, { status: 413, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Submit the waitlist form again." }, { status: 400, headers });
  }

  if (hasHoneypotValue(body)) {
    return Response.json({ ok: true }, { status: 202, headers });
  }

  const parsed = parseWaitlistInput(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400, headers });
  }

  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "The waitlist is being connected. Please try again shortly." },
      { status: 503, headers },
    );
  }

  const now = new Date();

  try {
    await getDb()
      .insert(waitlistEntries)
      .values({
        ...parsed.value,
        privacyAcceptedAt: now,
        source: "website",
      })
      .onConflictDoUpdate({
        target: waitlistEntries.email,
        set: {
          name: parsed.value.name,
          role: parsed.value.role,
          company: parsed.value.company,
          teamSize: parsed.value.teamSize,
          useCase: parsed.value.useCase,
          productUpdatesConsent: parsed.value.productUpdatesConsent,
          privacyAcceptedAt: now,
          updatedAt: now,
        },
      });

    return Response.json({ ok: true }, { status: 202, headers });
  } catch (error) {
    console.error("waitlist_submission_failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      { error: "The waitlist is temporarily unavailable. Please try again." },
      { status: 503, headers },
    );
  }
}
