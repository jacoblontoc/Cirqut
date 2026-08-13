const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ParseSuccess<T> = { ok: true; value: T };
type ParseFailure = { ok: false; error: string };
type ParseResult<T> = ParseSuccess<T> | ParseFailure;

function recordFrom(input: unknown): Record<string, unknown> | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return null;
  }

  return input as Record<string, unknown>;
}

function optionalText(value: unknown, maxLength: number) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized ? normalized.slice(0, maxLength) : null;
}

export function normalizeEmail(value: unknown) {
  if (typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email.length <= 320 && EMAIL_PATTERN.test(email) ? email : null;
}

export type WaitlistInput = {
  email: string;
  name: string | null;
  role: string | null;
  company: string | null;
  teamSize: string | null;
  useCase: string | null;
  productUpdatesConsent: boolean;
};

export function parseWaitlistInput(input: unknown): ParseResult<WaitlistInput> {
  const record = recordFrom(input);
  if (!record) return { ok: false, error: "Submit the waitlist form again." };

  const email = normalizeEmail(record.email);
  if (!email) return { ok: false, error: "Enter a valid email address." };
  if (record.privacyAccepted !== true) {
    return { ok: false, error: "Please acknowledge the privacy notice." };
  }

  return {
    ok: true,
    value: {
      email,
      name: optionalText(record.name, 120),
      role: optionalText(record.role, 120),
      company: optionalText(record.company, 160),
      teamSize: optionalText(record.teamSize, 60),
      useCase: optionalText(record.useCase, 1200),
      productUpdatesConsent: record.productUpdatesConsent === true,
    },
  };
}

export type ContactInput = {
  name: string;
  email: string;
  topic: string;
  message: string;
};

export function parseContactInput(input: unknown): ParseResult<ContactInput> {
  const record = recordFrom(input);
  if (!record) return { ok: false, error: "Submit the contact form again." };

  const name = optionalText(record.name, 120);
  const email = normalizeEmail(record.email);
  const topic = optionalText(record.topic, 80) ?? "general";
  const message = optionalText(record.message, 2400);

  if (!name) return { ok: false, error: "Enter your name." };
  if (!email) return { ok: false, error: "Enter a valid email address." };
  if (!message) return { ok: false, error: "Add a short message." };

  return { ok: true, value: { name, email, topic, message } };
}

export function hasHoneypotValue(input: unknown) {
  const record = recordFrom(input);
  return Boolean(optionalText(record?.website, 200));
}

export function isAllowedFormOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  const requestOrigin = new URL(request.url).origin;
  const configuredOrigin = process.env.APP_URL
    ? new URL(process.env.APP_URL).origin
    : null;

  return origin === requestOrigin || origin === configuredOrigin;
}
