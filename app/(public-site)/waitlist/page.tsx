import type { Metadata } from "next";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb, isDatabaseConfigured } from "@/db";
import { accessGrants, userProfiles, waitlistEntries } from "@/db/schema";
import { getAuth, isAuthConfigured } from "@/lib/auth/server";
import { DashboardShell } from "@/app/dashboard/dashboard-shell";
import { BetaAccessForms, DashboardGateExit, OnboardingBackButton } from "../_components/beta-access-forms";
import { AuthGateShell } from "../_components/public-shells";
import { WaitlistForm } from "../_components/waitlist-form";

export const metadata: Metadata = {
  title: "Join the waitlist | Cirqut",
  description: "Apply for the Cirqut private beta.",
};

export const dynamic = "force-dynamic";

async function getSessionUser() {
  if (!isAuthConfigured()) return null;

  try {
    const { data: session } = await getAuth().getSession();
    return session?.user ?? null;
  } catch {
    return null;
  }
}

export default async function WaitlistPage() {
  const user = await getSessionUser();

  if (!user) {
    return (
      <AuthGateShell variant="waitlist">
        <section className="auth-card waitlist-card" aria-labelledby="waitlist-form-title">
          <div className="auth-card-heading">
            <p>Private beta</p>
            <h1 id="waitlist-form-title">Join the waitlist.</h1>
            <span>Tell us a little about how you work.</span>
          </div>
          <WaitlistForm />
        </section>
      </AuthGateShell>
    );
  }

  const email = user.email.trim().toLowerCase();
  if (!user.emailVerified) {
    redirect(`/login?view=verify-email&email=${encodeURIComponent(email)}`);
  }

  let accessActive = false;
  let onboardingComplete = false;
  let productUpdatesConsent = false;
  let username = "";
  let databaseReady = isDatabaseConfigured();

  if (databaseReady) {
    try {
      const db = getDb();
      const now = new Date();
      const [[grant], [profile], [preference]] = await Promise.all([
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
      ]);

      accessActive = Boolean(grant);
      onboardingComplete = Boolean(profile?.onboardingCompletedAt);
      productUpdatesConsent = preference?.productUpdatesConsent ?? false;
      username = profile?.username ?? "";
    } catch {
      databaseReady = false;
    }
  }

  if (databaseReady && accessActive && onboardingComplete) {
    return (
      <>
        <div aria-hidden="true" inert>
          <DashboardShell
            activeWorkspace={null}
            avatarUrl={user.image}
            avatarSeed={user.id}
            displayName={user.name || email}
            email={email}
            memberCount={0}
            productUpdatesConsent={productUpdatesConsent}
            username={username}
            workspaces={[]}
          ><span /></DashboardShell>
        </div>
        <AuthGateShell variant="waitlist" back={false}><DashboardGateExit /></AuthGateShell>
      </>
    );
  }

  const needsOnboarding = databaseReady && accessActive && !onboardingComplete;
  const title = !databaseReady
    ? "Finish joining the private beta."
    : "Enter your invite key.";
  const description = !databaseReady
    ? "Your account is verified, but beta access is temporarily unavailable."
    : "Your account is verified. An invite key is still required for beta access.";

  return (
    <AuthGateShell variant="waitlist" back={needsOnboarding ? <OnboardingBackButton /> : undefined}>
      <section className="auth-card waitlist-card" {...(needsOnboarding ? { "aria-label": "Onboarding questions" } : { "aria-labelledby": "waitlist-form-title" })}>
        {!needsOnboarding && <div className="auth-card-heading">
          <p>Private beta</p>
          <h1 id="waitlist-form-title">{title}</h1>
          <span>{description}</span>
        </div>}
        <BetaAccessForms
          accessActive={accessActive}
          databaseReady={databaseReady}
          email={email}
          onboardingComplete={onboardingComplete}
          productUpdatesConsent={productUpdatesConsent}
        />
      </section>
    </AuthGateShell>
  );
}
