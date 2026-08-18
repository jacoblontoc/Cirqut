"use server";

import { and, eq, gt, isNull, or, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { getDb, isDatabaseConfigured } from "@/db";
import { accessGrants, userProfiles, waitlistEntries } from "@/db/schema";
import { getAuth, isAuthConfigured } from "@/lib/auth/server";
import { hashInviteKey, normalizeInviteKey } from "@/lib/invite-keys";

export type AccountActionState = { ok: boolean; message: string };

const personas = new Set<string>(["hobbyist", "student", "engineer", "founder", "team-member"]);
const experienceLevels = new Set<string>(["new", "some", "experienced", "expert"]);
const pcbTools = new Set<string>(["kicad", "altium", "flux", "none"]);
const cirqutGoals = new Set<string>(["research", "requirements", "component-selection", "schematic-preparation", "documentation"]);

async function getVerifiedUser() {
  if (!isAuthConfigured()) return null;
  const { data: session } = await getAuth().getSession();
  const user = session?.user;

  if (!user?.emailVerified) return null;

  return {
    id: user.id,
    email: user.email.trim().toLowerCase(),
    name: user.name,
  };
}

export async function redeemInvite(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getVerifiedUser();
  const inviteKey = normalizeInviteKey(formData.get("inviteKey"));

  if (!user || !inviteKey) {
    return { ok: false, message: "That invite key is invalid, expired, or already used." };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Beta access is temporarily unavailable. Try again shortly." };
  }

  try {
    const result = await getDb().execute(sql`
      WITH redeemed AS (
        UPDATE access_grants
        SET auth_user_id = ${user.id},
            status = 'active',
            accepted_at = now(),
            expires_at = NULL,
            updated_at = now(),
            invite_key_hash = NULL
        WHERE invite_key_hash = ${hashInviteKey(inviteKey)}
          AND email = ${user.email}
          AND status = 'pending'
          AND auth_user_id IS NULL
          AND (expires_at IS NULL OR expires_at > now())
          AND NOT EXISTS (
            SELECT 1 FROM access_grants claimed
            WHERE claimed.auth_user_id = ${user.id}
          )
        RETURNING id, referrer_auth_user_id
      ),
      audited AS (
        INSERT INTO audit_events (actor_auth_user_id, action, target_type, target_id, metadata)
        SELECT ${user.id}, 'beta_invite.redeemed', 'access_grant', id::text,
               jsonb_build_object('referrerAuthUserId', referrer_auth_user_id)
        FROM redeemed
        RETURNING target_id
      )
      SELECT redeemed.id
      FROM redeemed
      JOIN audited ON audited.target_id = redeemed.id::text
    `);

    if (result.rows.length === 0) {
      return { ok: false, message: "That invite key is invalid, expired, or already used." };
    }

    revalidatePath("/waitlist");
    return { ok: true, message: "Private-beta access is active." };
  } catch (error) {
    console.error("invite_redemption_failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false, message: "Beta access is temporarily unavailable. Try again shortly." };
  }
}

export async function saveOnboarding(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getVerifiedUser();
  const persona = String(formData.get("persona") ?? "");
  const pcbExperience = String(formData.get("pcbExperience") ?? "");
  const tools = [...new Set(formData.getAll("tools").map(String))];
  const goals = [...new Set(formData.getAll("goals").map(String))];

  if (
    !user
    || !personas.has(persona)
    || !experienceLevels.has(pcbExperience)
    || tools.length === 0
    || tools.some((tool) => !pcbTools.has(tool))
    || (tools.includes("none") && tools.length > 1)
    || goals.length === 0
    || goals.some((goal) => !cirqutGoals.has(goal))
  ) {
    return { ok: false, message: "Answer each question to finish onboarding." };
  }
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Onboarding is temporarily unavailable. Try again shortly." };
  }

  const now = new Date();

  try {
    const db = getDb();
    const [grant] = await db.select({ id: accessGrants.id })
      .from(accessGrants)
      .where(and(
        eq(accessGrants.authUserId, user.id),
        eq(accessGrants.status, "active"),
        or(isNull(accessGrants.expiresAt), gt(accessGrants.expiresAt, now)),
      ))
      .limit(1);

    if (!grant) return { ok: false, message: "A valid beta invite is required before onboarding." };

    await db.insert(userProfiles).values({
      authUserId: user.id,
      email: user.email,
      displayName: user.name,
      persona,
      pcbExperience,
      pcbTools: tools,
      cirqutGoals: goals,
      onboardingCompletedAt: now,
    }).onConflictDoUpdate({
      target: userProfiles.authUserId,
      set: {
        email: user.email,
        displayName: user.name,
        persona,
        pcbExperience,
        pcbTools: tools,
        cirqutGoals: goals,
        onboardingCompletedAt: now,
        updatedAt: now,
      },
    });

    revalidatePath("/waitlist");
    return { ok: true, message: "Onboarding complete." };
  } catch (error) {
    console.error("onboarding_save_failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false, message: "Onboarding is temporarily unavailable. Try again shortly." };
  }
}

export async function saveProductUpdates(
  _state: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  const user = await getVerifiedUser();

  if (!user) return { ok: false, message: "Sign in again to save this preference." };
  if (!isDatabaseConfigured()) {
    return { ok: false, message: "Notification preferences are temporarily unavailable." };
  }

  const now = new Date();
  const productUpdatesConsent = formData.get("productUpdatesConsent") === "on";

  try {
    await getDb().insert(waitlistEntries).values({
      email: user.email,
      name: user.name,
      source: "account",
      productUpdatesConsent,
      privacyAcceptedAt: now,
    }).onConflictDoUpdate({
      target: waitlistEntries.email,
      set: { productUpdatesConsent, updatedAt: now },
    });

    revalidatePath("/waitlist");
    return {
      ok: true,
      message: productUpdatesConsent
        ? "You’ll receive Cirqut launch and product updates."
        : "Launch and product updates are turned off.",
    };
  } catch (error) {
    console.error("account_preference_update_failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return { ok: false, message: "Notification preferences are temporarily unavailable." };
  }
}
