"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";

type FormState = "idle" | "submitting" | "success" | "error";

export function WaitlistForm() {
  const [state, setState] = useState<FormState>("idle");
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setState("submitting");
    setMessage("");

    const form = new FormData(formElement);
    const payload = {
      name: form.get("name"),
      email: form.get("email"),
      role: form.get("role"),
      company: form.get("company"),
      teamSize: form.get("teamSize"),
      useCase: form.get("useCase"),
      website: form.get("website"),
      privacyAccepted: form.get("privacyAccepted") === "on",
      productUpdatesConsent: form.get("productUpdatesConsent") === "on",
    };

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setState("error");
        setMessage(result.error || "Unable to join the waitlist. Please try again.");
        return;
      }

      setState("success");
      setMessage("You’re on the list. We’ll contact you when there is a useful beta fit.");
      formElement.reset();
    } catch {
      setState("error");
      setMessage("Unable to reach the waitlist. Please try again.");
    }
  }

  return (
    <form className="auth-form waitlist-form" onSubmit={submit}>
      <div className="waitlist-field-row">
        <label><span>Name <i>optional</i></span><input name="name" type="text" autoComplete="name" placeholder="Your name" /></label>
        <label><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label>
      </div>
      <div className="waitlist-field-row">
        <label><span>I’m joining as</span><select name="role" defaultValue=""><option value="" disabled>Select one</option><option value="learning">New to PCB design</option><option value="engineer">Electrical engineer</option><option value="team-lead">Engineering lead</option><option value="other">Other</option></select></label>
        <label><span>Company or school <i>optional</i></span><input name="company" type="text" autoComplete="organization" placeholder="Organization" /></label>
      </div>
      <label><span>What would you like Cirqut to make easier? <i>optional</i></span><textarea name="useCase" rows={4} placeholder="A short description of your PCB project or workflow" /></label>
      <label className="auth-honeypot" aria-hidden="true"><span>Website</span><input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
      <label className="auth-checkbox auth-checkbox-terms"><input name="privacyAccepted" type="checkbox" required /><span>I acknowledge the <Link href="/privacy">Privacy Notice</Link> for this waitlist submission.</span></label>
      <label className="auth-checkbox"><input name="productUpdatesConsent" type="checkbox" /><span>Send me occasional product updates in addition to beta-access emails.</span></label>
      <button className="button button--dark button--large button--full auth-submit" type="submit" disabled={state === "submitting" || state === "success"}>{state === "submitting" ? "Joining…" : state === "success" ? "Joined" : "Join the waitlist"}<span aria-hidden="true">→</span></button>
      <p className={`auth-status ${state === "error" ? "auth-status--error" : ""}`} aria-live="polite">{message}</p>
    </form>
  );
}
