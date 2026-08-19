import Link from "next/link";

import styles from "../../dashboard.module.css";
import { CreateProjectForm } from "../../product-forms";
import { requireActiveWorkspace } from "../../workspace-data";

export default async function NewProjectPage() {
  const context = await requireActiveWorkspace();
  return (
    <section className={styles.workspacePage}>
      <Link className={styles.backLink} href="/dashboard">← Projects</Link>
      <header className={styles.detailHeader}>
        <span className={styles.eyebrow}>{context.activeWorkspace.name}</span>
        <h1>Create project</h1>
        <p>Start with a name and the product goal. Detailed PCB work comes later.</p>
      </header>
      <CreateProjectForm />
    </section>
  );
}
