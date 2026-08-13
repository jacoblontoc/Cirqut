import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull, or } from "drizzle-orm";

import { getDb, isDatabaseConfigured } from "@/db";
import { accessGrants, userProfiles } from "@/db/schema";
import { getAuth, isAuthConfigured } from "@/lib/auth/server";
import { AccountActions } from "../_components/account-actions";
import { BrandMark } from "../_components/public-shells";

export const metadata: Metadata = {
  title: "Account | Cirqut",
  description: "Cirqut private-beta account access.",
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  if (!isAuthConfigured()) {
    redirect("/login?setup=required");
  }

  const { data: session } = await getAuth().getSession();
  if (!session?.user) {
    redirect("/login");
  }

  const user = session.user;
  const email = user.email.trim().toLowerCase();
  let accessActive = false;
  let databaseReady = isDatabaseConfigured();

  if (databaseReady) {
    try {
      const db = getDb();
      await db.insert(userProfiles).values({
        authUserId: user.id,
        email,
        displayName: user.name,
      }).onConflictDoUpdate({
        target: userProfiles.authUserId,
        set: { email, displayName: user.name, updatedAt: new Date() },
      });

      const [grant] = await db.select({ id: accessGrants.id })
        .from(accessGrants)
        .where(and(
          eq(accessGrants.status, "active"),
          or(eq(accessGrants.authUserId, user.id), eq(accessGrants.email, email)),
          or(isNull(accessGrants.expiresAt), gt(accessGrants.expiresAt, new Date())),
        ))
        .limit(1);

      accessActive = Boolean(grant);
    } catch {
      databaseReady = false;
    }
  }

  return (
    <main className="auth-page account-page">
      <header className="auth-header"><Link className="auth-brand-link" href="/" aria-label="Back to home"><BrandMark context="auth" /></Link><div className="auth-header-switch"><span>Signed in as {email}</span></div></header>
      <div className="account-shell">
        <section className="auth-card account-card">
          <div className="auth-card-heading"><p>Account</p><h1>{databaseReady ? accessActive ? "Private beta access is active." : "Your account is waiting for access." : "Account services are still being connected."}</h1><span>{databaseReady ? accessActive ? "Your identity and access grant are ready. The PCB workspace itself has not been built in this phase." : "Authentication and beta access are separate. We’ll notify you if your waitlist application is approved." : "Your session is valid, but the Cirqut database is not available in this environment."}</span></div>
          <div className="account-detail"><span>Email</span><strong>{email}</strong></div>
          <div className="account-detail"><span>Access</span><strong>{databaseReady ? accessActive ? "Approved" : "Pending" : "Unavailable"}</strong></div>
          <div className="account-actions"><AccountActions /><Link href="/contact?topic=account-access">Contact support</Link></div>
        </section>
      </div>
      <footer className="auth-footer"><span>© 2026</span><nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/">Back to home</Link></nav></footer>
    </main>
  );
}
