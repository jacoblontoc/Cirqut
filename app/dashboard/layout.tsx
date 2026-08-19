import type { Metadata } from "next";
import type { ReactNode } from "react";

import { DashboardShell } from "./dashboard-shell";
import { getDashboardContext } from "./workspace-data";

export const metadata: Metadata = { title: "Dashboard | Cirqut" };
export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const context = await getDashboardContext();
  return (
    <DashboardShell
      activeWorkspace={context.activeWorkspace}
      avatarUrl={context.user.image}
      avatarSeed={context.user.id}
      displayName={context.user.name || context.email}
      email={context.email}
      memberCount={context.memberCount}
      productUpdatesConsent={context.productUpdatesConsent}
      username={context.username}
      workspaces={context.workspaces}
    >
      {children}
    </DashboardShell>
  );
}
