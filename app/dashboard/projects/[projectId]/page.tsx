import Link from "next/link";
import { and, desc, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getDb } from "@/db";
import { boards, projects, userProfiles } from "@/db/schema";
import styles from "../../dashboard.module.css";
import { isValidRecordId, requireActiveWorkspace } from "../../workspace-data";

export default async function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!isValidRecordId(projectId)) notFound();
  const context = await requireActiveWorkspace();
  const db = getDb();
  const [[project], boardRows] = await Promise.all([
    db.select({
      id: projects.id,
      name: projects.name,
      description: projects.description,
      updatedAt: projects.updatedAt,
      creatorName: userProfiles.displayName,
      creatorEmail: userProfiles.email,
    })
      .from(projects)
      .leftJoin(userProfiles, eq(projects.createdByAuthUserId, userProfiles.authUserId))
      .where(and(eq(projects.id, projectId), eq(projects.organizationId, context.activeWorkspace.id)))
      .limit(1),
    db.select({
      id: boards.id,
      name: boards.name,
      purpose: boards.purpose,
      status: boards.status,
      updatedAt: boards.updatedAt,
    })
      .from(boards)
      .innerJoin(projects, eq(boards.projectId, projects.id))
      .where(and(eq(boards.projectId, projectId), eq(projects.organizationId, context.activeWorkspace.id)))
      .orderBy(desc(boards.updatedAt)),
  ]);
  if (!project) notFound();

  return (
    <section className={styles.workspacePage}>
      <Link className={styles.backLink} href="/dashboard">← Projects</Link>
      <header className={styles.workspaceHeader}>
        <div><span className={styles.eyebrow}>{context.activeWorkspace.name}</span><h1>{project.name}</h1></div>
        <Link className={styles.primaryLink} href={`/dashboard/projects/${project.id}/boards/new`}>Add board</Link>
      </header>
      <dl className={styles.overviewList}>
        <div><dt>Product goal</dt><dd>{project.description || "No product goal added."}</dd></div>
        <div><dt>Creator</dt><dd>{project.creatorName || project.creatorEmail || "Cirqut member"}</dd></div>
        <div><dt>Last updated</dt><dd>{formatDate(project.updatedAt)}</dd></div>
      </dl>

      <div className={styles.sectionTitle}><h2>Boards</h2><span>{boardRows.length}</span></div>
      {boardRows.length ? (
        <div className={styles.projectList}>
          {boardRows.map((board) => (
            <Link className={styles.projectRow} href={`/dashboard/projects/${project.id}/boards/${board.id}`} key={board.id}>
              <span><strong>{board.name}</strong><small>{board.purpose || "No purpose added."}</small></span>
              <span>{statusLabel(board.status)}</span>
              <time dateTime={board.updatedAt.toISOString()}>{formatDate(board.updatedAt)}</time>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.productEmptyState}>
          <h2>No boards yet</h2>
          <p>Add the first PCB that belongs to this project.</p>
          <Link className={styles.primaryLink} href={`/dashboard/projects/${project.id}/boards/new`}>Add your first board</Link>
        </div>
      )}
    </section>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}

function statusLabel(value: string) {
  return value === "not_started" ? "Not started" : value;
}
