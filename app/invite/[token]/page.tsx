import Link from "next/link";
import { eq } from "drizzle-orm";

import { acceptWorkspaceInvitation } from "@/app/dashboard/actions";
import styles from "@/app/dashboard/dashboard.module.css";
import { getSessionUser } from "@/app/dashboard/workspace-data";
import { getDb, isDatabaseConfigured } from "@/db";
import { organizations, workspaceInvitations } from "@/db/schema";
import { hashInviteKey, normalizeWorkspaceInviteToken } from "@/lib/invite-keys";

const statusMessages: Record<string, string> = {
  accepted: "This invitation has already been used.",
  revoked: "This invitation has been revoked.",
  expired: "This invitation has expired.",
  email: "Sign in with the email address that received this invitation.",
  invalid: "This invitation is invalid or no longer available.",
};

export default async function WorkspaceInvitationPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { token: tokenValue } = await params;
  const { status: requestedStatus } = await searchParams;
  const token = normalizeWorkspaceInviteToken(tokenValue);

  if (!token || !isDatabaseConfigured()) {
    return <InvitationMessage message={statusMessages.invalid} />;
  }

  const [invitation] = await getDb().select({
    email: workspaceInvitations.email,
    role: workspaceInvitations.role,
    status: workspaceInvitations.status,
    expiresAt: workspaceInvitations.expiresAt,
    workspaceName: organizations.name,
  })
    .from(workspaceInvitations)
    .innerJoin(organizations, eq(workspaceInvitations.organizationId, organizations.id))
    .where(eq(workspaceInvitations.tokenHash, hashInviteKey(token)))
    .limit(1);

  if (!invitation) return <InvitationMessage message={statusMessages.invalid} />;
  const status = requestedStatus && statusMessages[requestedStatus]
    ? requestedStatus
    : invitation.status !== "pending"
      ? invitation.status
      : invitation.expiresAt <= new Date()
        ? "expired"
        : "";
  if (status) return <InvitationMessage message={statusMessages[status]} />;

  const user = await getSessionUser();
  if (!user) {
    return (
      <main className={styles.invitePage}>
        <section className={styles.invitePanel}>
          <span className={styles.eyebrow}>Workspace invitation</span>
          <h1>Sign in to continue</h1>
          <p>Use your Cirqut account to securely accept this invitation.</p>
          <Link className={styles.primaryLink} href={`/login?returnTo=${encodeURIComponent(`/invite/${token}`)}`}>Log in</Link>
        </section>
      </main>
    );
  }

  if (user.email.trim().toLowerCase() !== invitation.email) {
    return <InvitationMessage message={statusMessages.email} />;
  }

  return (
    <main className={styles.invitePage}>
      <section className={styles.invitePanel}>
        <span className={styles.eyebrow}>Workspace invitation</span>
        <h1>Join {invitation.workspaceName}</h1>
        <p>You will join as {roleLabel(invitation.role)}. Workspace members can see its projects and boards.</p>
        <form action={acceptWorkspaceInvitation.bind(null, token)}>
          <button className={styles.primaryButton} type="submit">Accept invitation</button>
        </form>
      </section>
    </main>
  );
}

function InvitationMessage({ message }: { message: string }) {
  return (
    <main className={styles.invitePage}>
      <section className={styles.invitePanel}>
        <span className={styles.eyebrow}>Workspace invitation</span>
        <h1>Invitation unavailable</h1>
        <p>{message}</p>
        <Link className={styles.secondaryLink} href="/">Return to Cirqut</Link>
      </section>
    </main>
  );
}

function roleLabel(role: string) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}
