import styles from "./dashboard.module.css";

export default function DashboardLoading() {
  return <div className={styles.routeState} role="status">Loading workspace…</div>;
}
