"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import { BrandMark } from "./public-shells";

export function AuthShell({ socialEnabled }: { socialEnabled: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setStatus("");

    const form = new FormData(event.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });

    if (error) {
      setStatus(error.message || "Unable to log in. Check your details and try again.");
      setPending(false);
      return;
    }

    router.push("/account");
    router.refresh();
  }

  async function handleSocial(provider: "google" | "github") {
    if (!socialEnabled) return;

    setPending(true);
    setStatus("");

    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/account",
      errorCallbackURL: "/login?auth=error",
    });

    if (error) {
      setStatus(error.message || `Unable to continue with ${provider}.`);
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header">
        <Link className="auth-brand-link" href="/" aria-label="Back to home">
          <BrandMark context="auth" />
        </Link>
        <div className="auth-header-switch">
          <Link href="/waitlist">Join the waitlist</Link>
        </div>
      </header>

      <div className="auth-shell auth-shell--login">
        <section className="auth-card auth-card--login" aria-labelledby="auth-form-title">
          <div className="auth-card-heading">
            <h1 id="auth-form-title">Log in</h1>
            <span>Use the sign-in method connected to your approved account.</span>
          </div>

          <div className="auth-provider-grid">
            <button type="button" disabled={!socialEnabled || pending} onClick={() => handleSocial("google")}>
              <span className="auth-provider-icon auth-provider-icon-google" aria-hidden="true">G</span>
              Google
            </button>
            <button type="button" disabled={!socialEnabled || pending} onClick={() => handleSocial("github")}>
              <span className="auth-provider-icon auth-provider-icon-github" aria-hidden="true">GH</span>
              GitHub
            </button>
          </div>

          {!socialEnabled && <p className="auth-method-note">Social sign-in stays disabled until approved-account enforcement is live.</p>}

          <div className="auth-divider"><span>or continue with email</span></div>

          <form className="auth-form" onSubmit={handleSubmit}>
            <label>
              <span>Email</span>
              <input name="email" type="email" autoComplete="email" placeholder="you@company.com" required />
            </label>
            <label>
              <span>Password</span>
              <input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" minLength={8} required />
            </label>

            <div className="auth-form-options">
              <span>Account creation is invitation-only.</span>
              <Link href="/contact?topic=account-access">Need help?</Link>
            </div>

            <button className="auth-submit" type="submit" disabled={pending}>
              {pending ? "Logging in…" : "Log in"}<span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="auth-status" aria-live="polite">{status}</p>
        </section>
      </div>

      <footer className="auth-footer">
        <span>© 2026</span>
        <nav aria-label="Legal navigation">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/">Back to home</Link>
        </nav>
      </footer>
    </main>
  );
}
