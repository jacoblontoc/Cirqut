import type { Metadata } from "next";
import { AuthShell } from "../_components/auth-shell";
import { isSocialAuthEnabled } from "@/lib/auth/policy";

export const metadata: Metadata = {
  title: "Log in | Cirqut",
  description: "Log in to an approved Cirqut private-beta account.",
};

export default function LoginPage() {
  return <AuthShell socialEnabled={isSocialAuthEnabled()} />;
}
