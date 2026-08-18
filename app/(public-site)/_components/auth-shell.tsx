"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";

import { authClient } from "@/lib/auth/client";
import { AuthGateShell } from "./public-shells";

export type AuthView = "login" | "signup" | "verify-email" | "forgot-password" | "reset-password";

type AuthShellProps = {
  view?: AuthView;
  socialEnabled?: boolean;
  initialEmail?: string;
  initialStatus?: string;
  initialError?: boolean;
  token?: string;
};

const copy: Record<AuthView, { title: string; description: string }> = {
  login: { title: "Log in", description: "Continue to your Cirqut account." },
  signup: { title: "Create your account", description: "Verify your email, then enter an invite key for private-beta access." },
  "verify-email": { title: "Verify your email", description: "Enter the one-time code sent to your inbox." },
  "forgot-password": { title: "Reset your password", description: "We’ll email you a secure reset link." },
  "reset-password": { title: "Choose a new password", description: "Use at least eight characters." },
};

export function AuthShell({
  view = "login",
  socialEnabled = false,
  initialEmail = "",
  initialStatus = "",
  initialError = false,
  token = "",
}: AuthShellProps) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [isError, setIsError] = useState(initialError);
  const [pending, setPending] = useState(false);
  const [signupEmailOpen, setSignupEmailOpen] = useState(false);
  const signupEmailButtonRef = useRef<HTMLButtonElement>(null);
  const signupNameInputRef = useRef<HTMLInputElement>(null);

  function begin() {
    setPending(true);
    setStatus("");
    setIsError(false);
  }

  function fail(message: string) {
    setStatus(message);
    setIsError(true);
    setPending(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    begin();

    const form = new FormData(event.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(form.get("email") ?? "").trim(),
      password: String(form.get("password") ?? ""),
    });

    if (error) {
      fail(error.message || "Unable to log in. Check your details and try again.");
      return;
    }

    router.push("/waitlist");
    router.refresh();
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const password = String(form.get("password") ?? "");

    if (password !== String(form.get("confirmPassword") ?? "")) {
      fail("Passwords do not match.");
      return;
    }

    begin();
    const { error } = await authClient.signUp.email({
      name: String(form.get("name") ?? "").trim(),
      email,
      password,
      callbackURL: "/waitlist",
    });

    if (error) {
      fail(error.message || "Unable to create your account. Try again.");
      return;
    }

    router.push(`/login?view=verify-email&email=${encodeURIComponent(email)}`);
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    begin();

    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim();
    const submitter = (event.nativeEvent as SubmitEvent).submitter;

    if (submitter instanceof HTMLButtonElement && submitter.value === "resend") {
      const { error } = await authClient.emailOtp.sendVerificationOtp({
        email,
        type: "email-verification",
      });

      if (error) {
        fail("Unable to send a new code right now. Try again shortly.");
        return;
      }

      setStatus("A new verification code is on its way.");
      setPending(false);
      return;
    }

    const { error } = await authClient.emailOtp.verifyEmail({
      email,
      otp: String(form.get("otp") ?? "").trim(),
    });

    if (error) {
      fail(error.message || "That code is invalid or expired.");
      return;
    }

    router.push("/waitlist");
    router.refresh();
  }

  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    begin();

    const form = new FormData(event.currentTarget);
    const { error } = await authClient.requestPasswordReset({
      email: String(form.get("email") ?? "").trim(),
      redirectTo: "/login?view=reset-password",
    });

    if (error) {
      fail("Unable to request a reset right now. Try again shortly.");
      return;
    }

    setStatus("If an account exists for that email, a reset link is on its way.");
    setPending(false);
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("password") ?? "");

    if (!token) {
      fail("This reset link is missing or invalid. Request a new one.");
      return;
    }
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      fail("Passwords do not match.");
      return;
    }

    begin();
    const { error } = await authClient.resetPassword({ newPassword, token });

    if (error) {
      fail(error.message || "This reset link is invalid or expired.");
      return;
    }

    router.push("/login?reset=complete");
  }

  async function handleSocial(provider: "google" | "github") {
    if (!socialEnabled) return;
    begin();

    const { error } = await authClient.signIn.social({
      provider,
      callbackURL: "/waitlist",
      errorCallbackURL: `/login?view=${view}&auth=error`,
    });

    if (error) {
      fail(error.message || `Unable to continue with ${provider}.`);
    }
  }

  function openSignupEmail() {
    setStatus("");
    setIsError(false);
    setSignupEmailOpen(true);
    requestAnimationFrame(() => signupNameInputRef.current?.focus());
  }

  function showSignupChoices() {
    setStatus("");
    setIsError(false);
    setSignupEmailOpen(false);
    requestAnimationFrame(() => signupEmailButtonRef.current?.focus());
  }

  const heading = copy[view];
  const showProviders = view === "login" || (view === "signup" && !signupEmailOpen);

  return (
    <AuthGateShell variant="login">
      <section className="auth-card auth-card--login" aria-labelledby="auth-form-title">
        <div className="auth-card-heading">
          <h1 id="auth-form-title">{heading.title}</h1>
          <span>{heading.description}</span>
        </div>

        {showProviders && (
          <>
            <div className="auth-provider-grid" role="group" aria-label={view === "signup" ? "Choose how to create your account" : "Social sign-in"}>
              <button className="button button--light button--full" type="button" disabled={!socialEnabled || pending} onClick={() => handleSocial("google")}>
                <Image className="auth-provider-icon" src="/auth/google.png" alt="" width={20} height={20} aria-hidden="true" />
                Continue with Google
              </button>
              <button className="button button--light button--full" type="button" disabled={!socialEnabled || pending} onClick={() => handleSocial("github")}>
                <Image className="auth-provider-icon" src="/auth/github.svg" alt="" width={19} height={19} aria-hidden="true" />
                Continue with GitHub
              </button>
              {view === "signup" && (
                <button ref={signupEmailButtonRef} className="button button--light button--full" type="button" disabled={pending} onClick={openSignupEmail}>
                  Continue with Email
                </button>
              )}
            </div>
            {!socialEnabled && <p className="auth-method-note">Social sign-in is not available in this environment.</p>}
            {view === "signup" && <p className="auth-method-note">By continuing, you agree to the <Link href="/terms">terms</Link> and acknowledge the <Link href="/privacy">privacy notice</Link>.</p>}
            {view === "login" && <div className="auth-divider"><span>or continue with email</span></div>}
          </>
        )}

        {view === "login" && (
          <form className="auth-form" onSubmit={handleLogin}>
            <label><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label>
            <label><span>Password</span><input name="password" type="password" autoComplete="current-password" placeholder="Enter your password" minLength={8} required /></label>
            <div className="auth-form-options"><Link href="/login?view=verify-email">Verify email</Link><Link href="/login?view=forgot-password">Forgot password?</Link></div>
            <button className="button button--dark button--large button--full auth-submit" type="submit" disabled={pending}>{pending ? "Logging in…" : "Log in"}<span aria-hidden="true">→</span></button>
            <p className="auth-switch">New to Cirqut? <Link href="/login?view=signup">Create account</Link></p>
          </form>
        )}

        {view === "signup" && signupEmailOpen && (
          <form id="signup-email-form" className="auth-form auth-signup-email-form" onSubmit={handleSignup}>
            <div className="auth-form-options"><button type="button" disabled={pending} onClick={showSignupChoices}>← Back to sign-up options</button></div>
            <label><span>Name</span><input ref={signupNameInputRef} name="name" type="text" autoComplete="name" placeholder="Your name" maxLength={120} required /></label>
            <label><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label>
            <label><span>Password</span><input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /></label>
            <label><span>Confirm password</span><input name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password" minLength={8} required /></label>
            <label className="auth-checkbox auth-checkbox-terms"><input name="terms" type="checkbox" required /><span>I agree to the <Link href="/terms">terms</Link> and acknowledge the <Link href="/privacy">privacy notice</Link>.</span></label>
            <button className="button button--dark button--large button--full auth-submit" type="submit" disabled={pending}>{pending ? "Creating account…" : "Create account"}<span aria-hidden="true">→</span></button>
            <p className="auth-switch">Already have an account? <Link href="/login">Log in</Link></p>
          </form>
        )}

        {view === "verify-email" && (
          <form className="auth-form" onSubmit={handleVerify}>
            <label><span>Email</span><input name="email" type="email" autoComplete="email" defaultValue={initialEmail} required /></label>
            <label><span>Verification code</span><input name="otp" type="text" inputMode="numeric" autoComplete="one-time-code" placeholder="000000" minLength={6} maxLength={8} required /></label>
            <button className="button button--dark button--large button--full auth-submit" type="submit" disabled={pending}>{pending ? "Verifying…" : "Verify email"}<span aria-hidden="true">→</span></button>
            <div className="auth-form-options"><button type="submit" name="intent" value="resend" formNoValidate disabled={pending}>Send a new code</button><Link href="/login">Back to login</Link></div>
          </form>
        )}

        {view === "forgot-password" && (
          <form className="auth-form" onSubmit={handleForgotPassword}>
            <label><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label>
            <button className="button button--dark button--large button--full auth-submit" type="submit" disabled={pending}>{pending ? "Sending…" : "Email reset link"}<span aria-hidden="true">→</span></button>
            <p className="auth-switch"><Link href="/login">Back to login</Link></p>
          </form>
        )}

        {view === "reset-password" && (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <label><span>New password</span><input name="password" type="password" autoComplete="new-password" placeholder="At least 8 characters" minLength={8} required /></label>
            <label><span>Confirm password</span><input name="confirmPassword" type="password" autoComplete="new-password" placeholder="Repeat your password" minLength={8} required /></label>
            <button className="button button--dark button--large button--full auth-submit" type="submit" disabled={pending || !token}>{pending ? "Saving…" : "Save new password"}<span aria-hidden="true">→</span></button>
            <p className="auth-switch">Need a new link? <Link href="/login?view=forgot-password">Request one</Link></p>
          </form>
        )}

        <p className={`auth-status${isError ? " auth-status--error" : ""}`} aria-live="polite" {...(isError ? { role: "alert" } : {})}>{status}</p>
      </section>
    </AuthGateShell>
  );
}
