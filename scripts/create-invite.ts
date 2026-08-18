import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";

import { generateInviteKey, hashInviteKey } from "../lib/invite-keys.ts";
import { normalizeEmail } from "../lib/public-forms.ts";

config({ path: ".env.local" });

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function main() {
  const email = normalizeEmail(argument("--email"));
  const days = Number(argument("--days") ?? 14);
  const referrerAuthUserId = argument("--referrer-user-id")?.trim() || null;
  const databaseUrl = process.env.DATABASE_URL_UNPOOLED
    ?? process.env.DATABASE_DIRECT_URL
    ?? process.env.DATABASE_URL;

  if (!email || !Number.isInteger(days) || days < 1 || days > 365 || (referrerAuthUserId?.length ?? 0) > 255) {
    throw new Error("Usage: node scripts/create-invite.ts --email person@example.com [--days 1-365] [--referrer-user-id auth-user-id]");
  }
  if (!databaseUrl) {
    throw new Error("Pull the intended Vercel environment into .env.local before creating an invite.");
  }

  const key = generateInviteKey();
  const expiresAt = new Date(Date.now() + days * 86_400_000);
  const sql = neon(databaseUrl);
  const rows = await sql`
    INSERT INTO access_grants (
      email, invite_key_hash, status, referrer_auth_user_id, invited_at, expires_at
    ) VALUES (
      ${email}, ${hashInviteKey(key)}, 'pending', ${referrerAuthUserId}, now(), ${expiresAt}
    )
    ON CONFLICT (email) DO UPDATE
    SET invite_key_hash = EXCLUDED.invite_key_hash,
        auth_user_id = NULL,
        status = 'pending',
        referrer_auth_user_id = EXCLUDED.referrer_auth_user_id,
        invited_at = now(),
        accepted_at = NULL,
        expires_at = EXCLUDED.expires_at,
        updated_at = now()
    WHERE access_grants.status <> 'active'
    RETURNING id
  `;

  if (rows.length === 0) {
    throw new Error("That email already has active beta access; no new key was created.");
  }

  console.log(`Invite key for ${email}; expires ${expiresAt.toISOString()}:`);
  console.log(key);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Invite creation failed.");
  process.exitCode = 1;
});
