"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";

export function AccountActions() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return <button className="auth-submit" type="button" disabled={pending} onClick={signOut}>{pending ? "Signing out…" : "Sign out"}<span aria-hidden="true">→</span></button>;
}
