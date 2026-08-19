import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getDb } from "@/db";
import { boards, projects, userProfiles } from "@/db/schema";
import styles from "../../../../dashboard.module.css";
import { isValidRecordId, requireActiveWorkspace } from "../../../../workspace-data";

export default async function BoardOverviewPage({ params }: { params: Promise<{ projectId: string; boardId: string }> }) {
  const { projectId, boardId } = await params;
  if (!isValidRecordId(projectId) || !isValidRecordId(boardId)) notFound();
  const context = await requireActiveWorkspace();
  const [board] = await getDb().select({
    id: boards.id,
    name: boards.name,
    purpose: boards.purpose,
    description: boards.description,
    status: boards.status,
    updatedAt: boards.updatedAt,
    projectId: projects.id,
    projectName: projects.name,
    creatorName: userProfiles.displayName,
    creatorEmail: userProfiles.email,
  })
    .from(boards)
    .innerJoin(projects, eq(boards.projectId, projects.id))
    .leftJoin(userProfiles, eq(boards.createdByAuthUserId, userProfiles.authUserId))
    .where(and(
      eq(boards.id, boardId),
      eq(projects.id, projectId),
      eq(projects.organizationId, context.activeWorkspace.id),
    ))
    .limit(1);
  if (!board) notFound();

  return (
    <section className={styles.workspacePage}>
      <Link className={styles.backLink} href={`/dashboard/projects/${board.projectId}`}>← {board.projectName}</Link>
      <header className={styles.detailHeader}>
        <span className={styles.eyebrow}>{context.activeWorkspace.name}</span>
        <h1>{board.name}</h1>
        <p>{board.description || "No description added."}</p>
      </header>
      <dl className={styles.overviewList}>
        <div><dt>Parent project</dt><dd><Link href={`/dashboard/projects/${board.projectId}`}>{board.projectName}</Link></dd></div>
        <div><dt>Purpose</dt><dd>{board.purpose || "No purpose added."}</dd></div>
        <div><dt>Description</dt><dd>{board.description || "No description added."}</dd></div>
        <div><dt>Creator</dt><dd>{board.creatorName || board.creatorEmail || "Cirqut member"}</dd></div>
        <div><dt>Last updated</dt><dd>{formatDate(board.updatedAt)}</dd></div>
        <div><dt>Status</dt><dd><span className={styles.statusBadge}>{board.status === "not_started" ? "Not started" : board.status}</span></dd></div>
      </dl>
      <div className={styles.nextStep}><strong>Define requirements</strong><span>Coming next</span></div>
    </section>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}
