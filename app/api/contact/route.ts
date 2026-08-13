import { getDb, isDatabaseConfigured } from "@/db";
import { contactSubmissions } from "@/db/schema";
import {
  hasHoneypotValue,
  isAllowedFormOrigin,
  parseContactInput,
} from "@/lib/public-forms";

const headers = { "Cache-Control": "no-store" };

export async function POST(request: Request) {
  if (!isAllowedFormOrigin(request)) {
    return Response.json({ error: "Request origin is not allowed." }, { status: 403, headers });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Submit the contact form again." }, { status: 400, headers });
  }

  if (hasHoneypotValue(body)) {
    return Response.json({ ok: true }, { status: 202, headers });
  }

  const parsed = parseContactInput(body);
  if (!parsed.ok) {
    return Response.json({ error: parsed.error }, { status: 400, headers });
  }

  if (!isDatabaseConfigured()) {
    return Response.json(
      { error: "Contact intake is being connected. Please try again shortly." },
      { status: 503, headers },
    );
  }

  try {
    await getDb().insert(contactSubmissions).values(parsed.value);
    return Response.json({ ok: true }, { status: 202, headers });
  } catch (error) {
    console.error("contact_submission_failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return Response.json(
      { error: "Contact intake is temporarily unavailable. Please try again." },
      { status: 503, headers },
    );
  }
}
