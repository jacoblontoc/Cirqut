import Link from "next/link";
import { and, eq } from "drizzle-orm";
import { notFound } from "next/navigation";

import { getDb } from "@/db";
import { projects } from "@/db/schema";
import styles from "../../../../dashboard.module.css";
import { CreateBoardForm } from "../../../../product-forms";
import { isValidRecordId, requireActiveWorkspace } from "../../../../workspace-data";

export default async function NewBoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  if (!isValidRecordId(projectId)) notFound();
  const context = await requireActiveWorkspace();
  const [project] = await getDb().select({ id: projects.id, name: projects.name })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.organizationId, context.activeWorkspace.id)))
    .limit(1);
  if (!project) notFound();

  return (
    <section className={styles.workspacePage}>
      <Link className={styles.backLink} href={`/dashboard/projects/${project.id}`}>← {project.name}</Link>
      <header className={styles.detailHeader}>
        <span className={styles.eyebrow}>{context.activeWorkspace.name}</span>
        <h1>Add board</h1>
        <p>A board represents one specific PCB within {project.name}.</p>
      </header>
      <CreateBoardForm projectId={project.id} />
    </section>
  );
}
