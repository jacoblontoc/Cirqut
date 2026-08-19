import "server-only";

import { cache } from "react";
import { and, asc, count, eq, gt, isNull, or } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDb, isDatabaseConfigured } from "@/db";
import {
  accessGrants,
  organizationMemberships,
  organizations,
  userProfiles,
  waitlistEntries,
} from "@/db/schema";
import { getAuth, isAuthConfigured } from "@/lib/auth/server";

export const ACTIVE_WORKSPACE_COOKIE = "cirqut_active_workspace";

export function isValidRecordId(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export const getSessionUser = cache(async () => {
  if (!isAuthConfigured()) return null;

  try {
    const { data: session } = await getAuth().getSession();
    return session?.user ?? null;
  } catch {
    return null;
  }
});

export const getDashboardContext = cache(async () => {
  const user = await getSessionUser();
  if (!user) redirect("/login");

  const email = user.email.trim().toLowerCase();
  if (!user.emailVerified) redirect(`/login?view=verify-email&email=${encodeURIComponent(email)}`);
  if (!isDatabaseConfigured()) redirect("/waitlist");

  const db = getDb();
  const now = new Date();
  const result = await Promise.all([
      db.select({ id: accessGrants.id })
        .from(accessGrants)
        .where(and(
          eq(accessGrants.authUserId, user.id),
          eq(accessGrants.status, "active"),
          or(isNull(accessGrants.expiresAt), gt(accessGrants.expiresAt, now)),
        ))
        .limit(1),
      db.select({
        onboardingCompletedAt: userProfiles.onboardingCompletedAt,
        username: userProfiles.username,
      })
        .from(userProfiles)
        .where(eq(userProfiles.authUserId, user.id))
        .limit(1),
      db.select({ productUpdatesConsent: waitlistEntries.productUpdatesConsent })
        .from(waitlistEntries)
        .where(eq(waitlistEntries.email, email))
        .limit(1),
      db.select({
        id: organizations.id,
        name: organizations.name,
        role: organizationMemberships.role,
      })
        .from(organizationMemberships)
        .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
        .where(eq(organizationMemberships.authUserId, user.id))
        .orderBy(asc(organizations.name)),
    ]).catch(() => null);

  if (!result) redirect("/waitlist");
  const [[grant], [profile], [preference], workspaces] = result;

  if (!grant || !profile?.onboardingCompletedAt) redirect("/waitlist");

  const requestedWorkspaceId = (await cookies()).get(ACTIVE_WORKSPACE_COOKIE)?.value;
  const activeWorkspace = workspaces.find((workspace) => workspace.id === requestedWorkspaceId) ?? workspaces[0] ?? null;
  const [memberTotal] = activeWorkspace
    ? await db.select({ value: count() })
      .from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, activeWorkspace.id))
    : [{ value: 0 }];

  return {
    activeWorkspace,
    email,
    memberCount: Number(memberTotal.value),
    productUpdatesConsent: preference?.productUpdatesConsent ?? false,
    user,
    username: profile.username ?? "",
    workspaces,
  };
});

export async function requireActiveWorkspace() {
  const context = await getDashboardContext();
  if (!context.activeWorkspace) redirect("/dashboard");
  return { ...context, activeWorkspace: context.activeWorkspace };
}
