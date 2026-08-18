import type { Metadata } from "next";
import { and, eq, gt, isNull, or } from "drizzle-orm";
import { redirect } from "next/navigation";

import { getDb, isDatabaseConfigured } from "@/db";
import { accessGrants, userProfiles, waitlistEntries } from "@/db/schema";
import { getAuth, isAuthConfigured } from "@/lib/auth/server";
import { BetaAccessForms } from "../_components/beta-access-forms";
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
        db.select({ onboardingCompletedAt: userProfiles.onboardingCompletedAt })
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
    } catch {
      databaseReady = false;
    }
  }

  const title = !databaseReady
    ? "Finish joining the private beta."
    : accessActive
      ? onboardingComplete ? "You’re in." : "A few quick questions."
      : "Enter your invite key.";
  const description = !databaseReady
    ? "Your account is verified, but beta access is temporarily unavailable."
    : accessActive
      ? onboardingComplete ? "Your private-beta access is active." : "Help Cirqut fit how you work."
      : "Your account is verified. An invite key is still required for beta access.";

  return (
    <AuthGateShell variant="waitlist">
      <section className="auth-card waitlist-card" aria-labelledby="waitlist-form-title">
        <div className="auth-card-heading">
          <p>Private beta</p>
          <h1 id="waitlist-form-title">{title}</h1>
          <span>{description}</span>
        </div>
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
