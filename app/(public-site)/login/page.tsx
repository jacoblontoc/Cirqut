import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthShell, type AuthView } from "../_components/auth-shell";
import { isPublicSignUpOpen, isSocialAuthEnabled } from "@/lib/auth/policy";

export const metadata: Metadata = {
  title: "Log in | Cirqut",
  description: "Create, verify, or log in to a Cirqut account.",
};

const authViews = new Set<AuthView>([
  "login",
  "signup",
  "verify-email",
  "forgot-password",
  "reset-password",
]);

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const requestedView = typeof params.view === "string" ? params.view : "login";
  const view = authViews.has(requestedView as AuthView) ? requestedView as AuthView : "login";
  const requestedReturnTo = typeof params.returnTo === "string" ? params.returnTo : "";
  const returnTo = requestedReturnTo.startsWith("/invite/") && !requestedReturnTo.startsWith("//")
    ? requestedReturnTo
    : "/waitlist";

  if (view === "signup" && !isPublicSignUpOpen()) redirect("/waitlist");

  const initialStatus = params.reset === "complete"
    ? "Your password is updated. Log in with the new password."
    : params.auth === "error"
      ? "That sign-in attempt could not be completed. Try again."
      : params.setup === "required"
        ? "Authentication is not configured in this environment."
        : "";

  return (
    <AuthShell
      key={view}
      view={view}
      socialEnabled={isSocialAuthEnabled()}
      initialEmail={typeof params.email === "string" ? params.email : ""}
      initialStatus={initialStatus}
      initialError={params.auth === "error" || params.setup === "required"}
      returnTo={returnTo}
      token={typeof params.token === "string" ? params.token : ""}
    />
  );
}
