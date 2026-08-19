import { and, asc, eq, lt } from "drizzle-orm";

import { getDb } from "@/db";
import { organizationMemberships, userProfiles, workspaceInvitations } from "@/db/schema";
import { revokeWorkspaceInvitation } from "../actions";
import styles from "../dashboard.module.css";
import { WorkspaceInvitationForm } from "../product-forms";
import { requireActiveWorkspace } from "../workspace-data";

export default async function WorkspaceMembersPage() {
  const context = await requireActiveWorkspace();
  const db = getDb();
  const canManage = context.activeWorkspace.role === "owner" || context.activeWorkspace.role === "admin";

  await db.update(workspaceInvitations)
    .set({ status: "expired", updatedAt: new Date() })
    .where(and(
      eq(workspaceInvitations.organizationId, context.activeWorkspace.id),
      eq(workspaceInvitations.status, "pending"),
      lt(workspaceInvitations.expiresAt, new Date()),
    ));

  const [members, pendingInvitations] = await Promise.all([
    db.select({
      id: organizationMemberships.id,
      name: userProfiles.displayName,
      email: userProfiles.email,
      role: organizationMemberships.role,
      joinedAt: organizationMemberships.createdAt,
    })
      .from(organizationMemberships)
      .leftJoin(userProfiles, eq(organizationMemberships.authUserId, userProfiles.authUserId))
      .where(eq(organizationMemberships.organizationId, context.activeWorkspace.id))
      .orderBy(asc(organizationMemberships.createdAt)),
    db.select({
      id: workspaceInvitations.id,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      expiresAt: workspaceInvitations.expiresAt,
    })
      .from(workspaceInvitations)
      .where(and(
        eq(workspaceInvitations.organizationId, context.activeWorkspace.id),
        eq(workspaceInvitations.status, "pending"),
      ))
      .orderBy(asc(workspaceInvitations.createdAt)),
  ]);

  return (
    <section className={styles.workspacePage}>
      <header className={styles.detailHeader}>
        <span className={styles.eyebrow}>{context.activeWorkspace.name}</span>
        <h1>Members</h1>
        <p>Everyone here can see the workspace’s projects and boards.</p>
      </header>

      <div className={styles.sectionTitle}><h2>Workspace members</h2><span>{members.length}</span></div>
      <div className={styles.memberTable} role="table" aria-label="Workspace members">
        <div className={styles.memberTableHeader} role="row"><span>Name</span><span>Role</span><span>Status</span><span>Joined</span></div>
        {members.map((member) => (
          <div className={styles.memberRow} role="row" key={member.id}>
            <span><strong>{member.name || member.email || "Cirqut member"}</strong><small>{member.email || "Email unavailable"}</small></span>
            <span>{roleLabel(member.role)}</span>
            <span>Active</span>
            <time dateTime={member.joinedAt.toISOString()}>{formatDate(member.joinedAt)}</time>
          </div>
        ))}
      </div>

      {canManage && (
        <>
          <div className={styles.sectionTitle}><h2>Invite a member</h2></div>
          <WorkspaceInvitationForm />
          <div className={styles.sectionTitle}><h2>Pending invitations</h2><span>{pendingInvitations.length}</span></div>
          {pendingInvitations.length ? (
            <div className={styles.pendingList}>
              {pendingInvitations.map((invitation) => (
                <div className={styles.pendingRow} key={invitation.id}>
                  <span><strong>{invitation.email}</strong><small>{roleLabel(invitation.role)} · Expires {formatDate(invitation.expiresAt)}</small></span>
                  <form action={revokeWorkspaceInvitation}>
                    <input name="invitationId" type="hidden" value={invitation.id} />
                    <button className={styles.secondaryButton} type="submit">Revoke</button>
                  </form>
                </div>
              ))}
            </div>
          ) : <p className={styles.quietEmpty}>No pending invitations.</p>}
        </>
      )}
    </section>
  );
}

function roleLabel(role: string) {
  if (role === "owner") return "Owner";
  if (role === "admin") return "Admin";
  return "Member";
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}
