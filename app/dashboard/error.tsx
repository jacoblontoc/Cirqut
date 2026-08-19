"use client";

import styles from "./dashboard.module.css";

export default function DashboardError({ reset }: { reset: () => void }) {
  return (
    <div className={styles.routeState} role="alert">
      <strong>Workspace unavailable</strong>
      <span>Refresh this view and try again.</span>
      <button className={styles.secondaryButton} type="button" onClick={reset}>Try again</button>
    </div>
  );
}
