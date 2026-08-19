"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth/client";
import {
  redeemInvite,
  saveOnboarding,
  saveProductUpdates,
  type AccountActionState,
} from "../waitlist/actions";

const initialState: AccountActionState = { ok: false, message: "" };

export function DashboardGateExit() {
  const router = useRouter();

  useEffect(() => {
    document.body.dataset.authGateTarget = "dashboard";
    document.body.dataset.authGate = "exiting";
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 760;
    const timer = window.setTimeout(() => router.replace("/dashboard"), delay);

    return () => {
      window.clearTimeout(timer);
      delete document.body.dataset.authGate;
      delete document.body.dataset.authGateTarget;
    };
  }, [router]);

  return null;
}

export function OnboardingBackButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function leaveOnboarding() {
    setPending(true);
    const { error } = await authClient.signOut();

    if (error) {
      setPending(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <button className="auth-gate__back" type="button" data-auth-gate-back disabled={pending} onClick={leaveOnboarding}>
      <span aria-hidden="true">←</span> {pending ? "Signing out…" : "Back"}
    </button>
  );
}

export function BetaAccessForms({
  accessActive,
  databaseReady,
  email,
  onboardingComplete,
  productUpdatesConsent,
}: {
  accessActive: boolean;
  databaseReady: boolean;
  email: string;
  onboardingComplete: boolean;
  productUpdatesConsent: boolean;
}) {
  const router = useRouter();
  const [inviteState, inviteAction, invitePending] = useActionState(redeemInvite, initialState);
  const [onboardingState, onboardingAction, onboardingPending] = useActionState(saveOnboarding, initialState);
  const [updatesState, updatesAction, updatesPending] = useActionState(saveProductUpdates, initialState);
  const [signOutPending, setSignOutPending] = useState(false);
  const needsOnboarding = databaseReady && accessActive && !onboardingComplete;

  useEffect(() => {
    if (inviteState.ok || onboardingState.ok) router.refresh();
  }, [inviteState.ok, onboardingState.ok, router]);

  async function signOut() {
    setSignOutPending(true);
    await authClient.signOut();
    router.refresh();
  }

  return (
    <div className="beta-access-forms">
      {!needsOnboarding && <div className="beta-account-meta"><span>Signed in as</span><strong>{email}</strong></div>}

      {databaseReady && !accessActive && (
        <form className="auth-form beta-access-form" action={inviteAction}>
          <label>
            <span>Invite key</span>
            <input
              name="inviteKey"
              type="text"
              autoComplete="off"
              spellCheck={false}
              placeholder="cq_beta_…"
              pattern="cq_beta_[A-Za-z0-9_-]{43}"
              required
            />
          </label>
          <button className="button button--dark button--large button--full auth-submit" type="submit" disabled={invitePending}>
            {invitePending ? "Checking key…" : "Activate beta access"}<span aria-hidden="true">→</span>
          </button>
          <p className={`auth-status${inviteState.message && !inviteState.ok ? " auth-status--error" : ""}`} aria-live="polite" {...(inviteState.message && !inviteState.ok ? { role: "alert" } : {})}>{inviteState.message}</p>
        </form>
      )}

      {needsOnboarding && (
        <form className="auth-form beta-onboarding-form" action={onboardingAction}>
          <label>
            <span>Choose your username</span>
            <input
              name="username"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              minLength={3}
              maxLength={24}
              pattern="[a-z0-9_]{3,24}"
              placeholder="@username"
              required
            />
            <small>3–24 letters, numbers, or underscores. You can change this later.</small>
          </label>
          <fieldset>
            <legend>What best describes you?</legend>
            <div className="beta-choice-grid">
              {[["hobbyist", "Hobbyist"], ["student", "Student"], ["engineer", "Engineer"], ["founder", "Founder"], ["team-member", "Team member"]].map(([value, label]) => (
                <label className="beta-choice" key={value}><input name="persona" type="radio" value={value} required /><span>{label}</span></label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>How experienced are you with PCB design?</legend>
            <div className="beta-choice-grid">
              {[["new", "New to it"], ["some", "Some experience"], ["experienced", "Experienced"], ["expert", "Expert"]].map(([value, label]) => (
                <label className="beta-choice" key={value}><input name="pcbExperience" type="radio" value={value} required /><span>{label}</span></label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>What tools have you used?</legend>
            <div className="beta-choice-grid">
              {[["kicad", "KiCad"], ["altium", "Altium"], ["flux", "Flux"], ["none", "None"]].map(([value, label]) => (
                <label className="beta-choice" key={value}><input name="tools" type="checkbox" value={value} /><span>{label}</span></label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>What are you hoping Cirqut helps with?</legend>
            <div className="beta-choice-grid">
              {[["research", "Research"], ["requirements", "Requirements"], ["component-selection", "Component selection"], ["schematic-preparation", "Schematic preparation"], ["documentation", "Documentation"]].map(([value, label]) => (
                <label className="beta-choice" key={value}><input name="goals" type="checkbox" value={value} /><span>{label}</span></label>
              ))}
            </div>
          </fieldset>

          <button className="button button--dark button--large button--full auth-submit" type="submit" disabled={onboardingPending}>
            {onboardingPending ? "Saving…" : "Finish onboarding"}<span aria-hidden="true">→</span>
          </button>
          <p className={`auth-status${onboardingState.message && !onboardingState.ok ? " auth-status--error" : ""}`} aria-live="polite" {...(onboardingState.message && !onboardingState.ok ? { role: "alert" } : {})}>{onboardingState.message}</p>
        </form>
      )}

      {databaseReady && (!accessActive || onboardingComplete) ? (
        <form className="auth-form beta-updates-form" action={updatesAction}>
          <div>
            <strong>{accessActive ? "Stay in the loop" : "Not invited yet?"}</strong>
            <p>Choose whether you want Cirqut launch and product updates.</p>
          </div>
          <label className="auth-checkbox">
            <input name="productUpdatesConsent" type="checkbox" defaultChecked={productUpdatesConsent} />
            <span>Email me launch news and occasional product updates. I can turn this off anytime.</span>
          </label>
          <button className="button button--dark button--large button--full auth-submit" type="submit" disabled={updatesPending}>
            {updatesPending ? "Saving…" : "Save preference"}<span aria-hidden="true">→</span>
          </button>
          <p className={`auth-status${updatesState.message && !updatesState.ok ? " auth-status--error" : ""}`} aria-live="polite" {...(updatesState.message && !updatesState.ok ? { role: "alert" } : {})}>{updatesState.message}</p>
        </form>
      ) : !databaseReady ? (
        <p className="auth-status auth-status--error" role="alert">Account preferences are temporarily unavailable.</p>
      ) : null}

      {!needsOnboarding && <button className="button button--light button--full beta-signout" type="button" disabled={signOutPending} onClick={signOut}>
        {signOutPending ? "Signing out…" : "Sign out"}
      </button>}
    </div>
  );
}
