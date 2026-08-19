import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";

import { getDb } from "@/db";
import { boards, projects } from "@/db/schema";
import { CreateWorkspaceForm } from "./product-forms";
import styles from "./dashboard.module.css";
import { getDashboardContext } from "./workspace-data";

export default async function DashboardPage() {
  const context = await getDashboardContext();

  if (!context.activeWorkspace) {
    return (
      <section className={styles.workspacePage}>
        <div className={styles.emptyWorkspace}>
          <span className={styles.eyebrow}>Workspace</span>
          <h1>Create your workspace</h1>
          <p>A workspace keeps your projects, boards, and members together. No project will be created automatically.</p>
          <CreateWorkspaceForm />
        </div>
      </section>
    );
  }

  const projectRows = await getDb().select({
    id: projects.id,
    name: projects.name,
    description: projects.description,
    updatedAt: projects.updatedAt,
    boardCount: sql<number>`count(${boards.id})::int`,
  })
    .from(projects)
    .leftJoin(boards, eq(boards.projectId, projects.id))
    .where(eq(projects.organizationId, context.activeWorkspace.id))
    .groupBy(projects.id)
    .orderBy(desc(projects.updatedAt));

  return (
    <section className={styles.workspacePage}>
      <header className={styles.workspaceHeader}>
        <div><span className={styles.eyebrow}>Workspace</span><h1>{context.activeWorkspace.name}</h1></div>
        <Link className={styles.primaryLink} href="/dashboard/projects/new">Create project</Link>
      </header>

      <div className={styles.sectionTitle}><h2>Projects</h2><span>{projectRows.length}</span></div>
      {projectRows.length ? (
        <div className={styles.projectList}>
          {projectRows.map((project) => (
            <Link className={styles.projectRow} href={`/dashboard/projects/${project.id}`} key={project.id}>
              <span><strong>{project.name}</strong><small>{project.description || "No product goal added."}</small></span>
              <span>{project.boardCount} {project.boardCount === 1 ? "board" : "boards"}</span>
              <time dateTime={project.updatedAt.toISOString()}>{formatDate(project.updatedAt)}</time>
            </Link>
          ))}
        </div>
      ) : (
        <div className={styles.productEmptyState}>
          <h2>No projects yet</h2>
          <p>Create a project when you are ready to start organizing a PCB product.</p>
          <Link className={styles.primaryLink} href="/dashboard/projects/new">Create your first project</Link>
        </div>
      )}
    </section>
  );
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(value);
}
