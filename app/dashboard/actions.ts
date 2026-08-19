"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getDb, isDatabaseConfigured } from "@/db";
import {
  auditEvents,
  boards,
  organizationMemberships,
  organizations,
  projects,
  userProfiles,
  workspaceInvitations,
} from "@/db/schema";
import {
  generateWorkspaceInviteToken,
  hashInviteKey,
  normalizeWorkspaceInviteToken,
} from "@/lib/invite-keys";
import { normalizeEmail } from "@/lib/public-forms";
import {
  ACTIVE_WORKSPACE_COOKIE,
  getDashboardContext,
  getSessionUser,
  isValidRecordId,
  requireActiveWorkspace,
} from "./workspace-data";

export type WorkspaceActionState = {
  message: string;
  invitationPath?: string;
};

function textField(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

async function setActiveWorkspace(organizationId: string) {
  (await cookies()).set(ACTIVE_WORKSPACE_COOKIE, organizationId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
}

async function requireWorkspaceAdmin() {
  const context = await requireActiveWorkspace();
  if (context.activeWorkspace.role !== "owner" && context.activeWorkspace.role !== "admin") {
    throw new Error("You do not have permission to manage this workspace.");
  }
  return context;
}

export async function switchWorkspace(formData: FormData) {
  const workspaceId = textField(formData, "workspaceId", 36);
  const context = await getDashboardContext();
  const workspace = context.workspaces.find((item) => item.id === workspaceId);
  if (!workspace) throw new Error("Workspace access was not found.");

  await setActiveWorkspace(workspace.id);
  redirect("/dashboard");
}

export async function createWorkspace(
  _previous: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const context = await getDashboardContext();
  if (context.workspaces.length > 0) return { message: "You already belong to a workspace." };

  const name = textField(formData, "name", 80);
  if (name.length < 2) return { message: "Enter a workspace name." };

  const id = randomUUID();
  const slugBase = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "workspace";
  const slug = `${slugBase}-${randomBytes(4).toString("hex")}`;
  const db = getDb();

  try {
    await db.batch([
      db.insert(organizations).values({ id, name, slug, createdByAuthUserId: context.user.id }),
      db.insert(organizationMemberships).values({ organizationId: id, authUserId: context.user.id, role: "owner" }),
      db.insert(auditEvents).values({ organizationId: id, actorAuthUserId: context.user.id, action: "workspace.created", targetType: "workspace", targetId: id }),
    ]);
  } catch {
    return { message: "A workspace could not be created. Refresh and try again." };
  }

  await setActiveWorkspace(id);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function createProject(
  _previous: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const context = await requireActiveWorkspace();
  const name = textField(formData, "name", 120);
  const description = textField(formData, "description", 500);
  if (!name) return { message: "Enter a project name." };

  const id = randomUUID();
  const db = getDb();
  try {
    await db.batch([
      db.insert(projects).values({
        id,
        organizationId: context.activeWorkspace.id,
        name,
        description: description || null,
        createdByAuthUserId: context.user.id,
      }),
      db.insert(auditEvents).values({
        organizationId: context.activeWorkspace.id,
        actorAuthUserId: context.user.id,
        action: "project.created",
        targetType: "project",
        targetId: id,
      }),
    ]);
  } catch {
    return { message: "The project could not be created. Try again." };
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${id}`);
}

export async function createBoard(
  projectId: string,
  _previous: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  if (!isValidRecordId(projectId)) return { message: "That project is not available." };
  const context = await requireActiveWorkspace();
  const db = getDb();
  const [project] = await db.select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, context.activeWorkspace.id)))
    .limit(1);
  if (!project) return { message: "That project is not available in this workspace." };

  const name = textField(formData, "name", 120);
  const purpose = textField(formData, "purpose", 240);
  const description = textField(formData, "description", 500);
  if (!name) return { message: "Enter a board name." };

  const id = randomUUID();
  try {
    await db.batch([
      db.insert(boards).values({
        id,
        projectId: project.id,
        name,
        purpose: purpose || null,
        description: description || null,
        createdByAuthUserId: context.user.id,
      }),
      db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, project.id)),
      db.insert(auditEvents).values({
        organizationId: context.activeWorkspace.id,
        actorAuthUserId: context.user.id,
        action: "board.created",
        targetType: "board",
        targetId: id,
      }),
    ]);
  } catch {
    return { message: "The board could not be created. Try again." };
  }

  revalidatePath(`/dashboard/projects/${project.id}`);
  redirect(`/dashboard/projects/${project.id}/boards/${id}`);
}

export async function createWorkspaceInvitation(
  _previous: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  let context;
  try {
    context = await requireWorkspaceAdmin();
  } catch (error) {
    return { message: error instanceof Error ? error.message : "Invitation access was denied." };
  }

  const email = normalizeEmail(formData.get("email"));
  const requestedRole = textField(formData, "role", 16);
  const role = requestedRole === "admin" || requestedRole === "member" ? requestedRole : null;
  if (!email) return { message: "Enter a valid email address." };
  if (!role) return { message: "Choose Admin or Member." };

  const db = getDb();
  const [existingMember] = await db.select({ id: organizationMemberships.id })
    .from(organizationMemberships)
    .innerJoin(userProfiles, eq(organizationMemberships.authUserId, userProfiles.authUserId))
    .where(and(
      eq(organizationMemberships.organizationId, context.activeWorkspace.id),
      eq(userProfiles.email, email),
    ))
    .limit(1);
  if (existingMember) return { message: "That person is already a workspace member." };

  const token = generateWorkspaceInviteToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  try {
    await db.insert(workspaceInvitations).values({
      organizationId: context.activeWorkspace.id,
      email,
      role,
      tokenHash: hashInviteKey(token),
      status: "pending",
      invitedByAuthUserId: context.user.id,
      expiresAt,
    }).onConflictDoUpdate({
      target: [workspaceInvitations.organizationId, workspaceInvitations.email],
      set: {
        role,
        tokenHash: hashInviteKey(token),
        status: "pending",
        invitedByAuthUserId: context.user.id,
        acceptedByAuthUserId: null,
        expiresAt,
        acceptedAt: null,
        revokedAt: null,
        updatedAt: new Date(),
      },
    });
  } catch {
    return { message: "The invitation could not be created. Try again." };
  }

  revalidatePath("/dashboard/members");
  return {
    message: "Invitation created. Copy this link now; it cannot be shown again.",
    invitationPath: `/invite/${token}`,
  };
}

export async function revokeWorkspaceInvitation(formData: FormData) {
  const invitationId = textField(formData, "invitationId", 36);
  if (!isValidRecordId(invitationId)) throw new Error("Invitation not found.");
  const context = await requireWorkspaceAdmin();
  const db = getDb();
  const [revoked] = await db.update(workspaceInvitations)
    .set({ status: "revoked", revokedAt: new Date(), updatedAt: new Date() })
    .where(and(
      eq(workspaceInvitations.id, invitationId),
      eq(workspaceInvitations.organizationId, context.activeWorkspace.id),
      eq(workspaceInvitations.status, "pending"),
    ))
    .returning({ id: workspaceInvitations.id });
  if (!revoked) throw new Error("That invitation is no longer pending.");

  revalidatePath("/dashboard/members");
}

export async function acceptWorkspaceInvitation(tokenValue: string) {
  const token = normalizeWorkspaceInviteToken(tokenValue);
  if (!token || !isDatabaseConfigured()) redirect("/invite/invalid?status=invalid");

  const returnTo = `/invite/${token}`;
  const user = await getSessionUser();
  if (!user) redirect(`/login?returnTo=${encodeURIComponent(returnTo)}`);
  const email = user.email.trim().toLowerCase();
  if (!user.emailVerified) {
    redirect(`/login?view=verify-email&email=${encodeURIComponent(email)}&returnTo=${encodeURIComponent(returnTo)}`);
  }

  const db = getDb();
  const tokenHash = hashInviteKey(token);
  const [invitation] = await db.select({
    organizationId: workspaceInvitations.organizationId,
    email: workspaceInvitations.email,
    role: workspaceInvitations.role,
    status: workspaceInvitations.status,
    expiresAt: workspaceInvitations.expiresAt,
  })
    .from(workspaceInvitations)
    .where(eq(workspaceInvitations.tokenHash, tokenHash))
    .limit(1);

  if (!invitation) redirect(`${returnTo}?status=invalid`);
  if (invitation.email !== email) redirect(`${returnTo}?status=email`);
  if (invitation.status !== "pending") redirect(`${returnTo}?status=${invitation.status}`);
  if (invitation.expiresAt <= new Date()) {
    await db.update(workspaceInvitations)
      .set({ status: "expired", updatedAt: new Date() })
      .where(and(eq(workspaceInvitations.tokenHash, tokenHash), eq(workspaceInvitations.status, "pending")));
    redirect(`${returnTo}?status=expired`);
  }
  if (invitation.role !== "owner" && invitation.role !== "admin" && invitation.role !== "member") {
    redirect(`${returnTo}?status=invalid`);
  }

  await db.insert(userProfiles).values({
    authUserId: user.id,
    email,
    displayName: user.name || null,
  }).onConflictDoUpdate({
    target: userProfiles.authUserId,
    set: { email, displayName: user.name || null, updatedAt: new Date() },
  });

  const accepted = await db.execute<{ organizationId: string }>(sql`
    WITH accepted AS (
      UPDATE ${workspaceInvitations}
      SET status = 'accepted',
          accepted_at = now(),
          accepted_by_auth_user_id = ${user.id},
          updated_at = now()
      WHERE token_hash = ${tokenHash}
        AND status = 'pending'
        AND expires_at > now()
      RETURNING organization_id, role
    ), membership AS (
      INSERT INTO ${organizationMemberships} (organization_id, auth_user_id, role)
      SELECT organization_id, ${user.id}, role FROM accepted
      ON CONFLICT (organization_id, auth_user_id) DO NOTHING
    )
    SELECT organization_id AS "organizationId" FROM accepted
  `);

  const organizationId = accepted.rows[0]?.organizationId;
  if (!organizationId) redirect(`${returnTo}?status=invalid`);

  await setActiveWorkspace(organizationId);
  await db.insert(auditEvents).values({
    organizationId,
    actorAuthUserId: user.id,
    action: "workspace.invitation.accepted",
    targetType: "workspace",
    targetId: organizationId,
  });
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
