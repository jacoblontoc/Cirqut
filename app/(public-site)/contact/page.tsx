"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { BrandMark } from "../_components/public-shells";

export default function ContactPage() {
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setPending(true);
    setStatus("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          email: form.get("email"),
          topic: form.get("topic"),
          message: form.get("message"),
          website: form.get("website"),
        }),
      });
      const result = await response.json() as { error?: string };

      if (!response.ok) {
        setStatus(result.error || "Unable to send your inquiry. Please try again.");
        return;
      }

      formElement.reset();
      setStatus("Your inquiry was received. We’ll follow up by email.");
    } catch {
      setStatus("Unable to reach contact intake. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="auth-page">
      <header className="auth-header"><Link className="auth-brand-link" href="/" aria-label="Back to home"><BrandMark context="auth" /></Link><div className="auth-header-switch"><span>Already approved?</span><Link href="/login">Log in</Link></div></header>
      <div className="auth-shell">
        <section className="auth-context"><div className="auth-context-copy"><p className="auth-eyebrow"><i />Contact</p><h1>Talk with the Cirqut team.</h1><p className="auth-context-description">Ask about the beta, account access, team evaluation, or planned enterprise identity support.</p></div><div className="auth-feature-list"><div className="auth-feature"><span>01</span><div><h2>Beta</h2><p>Discuss an early PCB workflow evaluation.</p></div></div><div className="auth-feature"><span>02</span><div><h2>Teams</h2><p>Share collaboration and review requirements.</p></div></div><div className="auth-feature"><span>03</span><div><h2>Enterprise</h2><p>Plan SSO and organization access needs.</p></div></div></div></section>
        <section className="auth-card" aria-labelledby="contact-title"><div className="auth-card-heading"><p>Contact</p><h2 id="contact-title">Send an inquiry</h2><span>We store the information below so the team can follow up.</span></div><form className="auth-form" onSubmit={submit}><label><span>Name</span><input name="name" type="text" autoComplete="name" placeholder="Your name" required /></label><label><span>Email</span><input name="email" type="email" autoComplete="email" placeholder="you@company.com" required /></label><label><span>Topic</span><select name="topic" defaultValue="general"><option value="general">General question</option><option value="beta">Private beta</option><option value="account-access">Account access</option><option value="enterprise-sso">Enterprise SSO</option></select></label><label><span>Message</span><textarea name="message" rows={5} placeholder="How can we help?" required /></label><label className="auth-honeypot" aria-hidden="true"><span>Website</span><input name="website" type="text" tabIndex={-1} autoComplete="off" /></label><button className="button button--dark button--large button--full auth-submit" type="submit" disabled={pending}>{pending ? "Sending…" : "Send inquiry"}<span aria-hidden="true">→</span></button></form><p className="auth-prototype-note">By submitting, you acknowledge the <Link href="/privacy">Privacy Notice</Link>. This form does not subscribe you to marketing updates.</p><p className="auth-status" aria-live="polite">{status}</p></section>
      </div>
      <footer className="auth-footer"><span>© 2026</span><nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/">Back to home</Link></nav></footer>
    </main>
  );
}
