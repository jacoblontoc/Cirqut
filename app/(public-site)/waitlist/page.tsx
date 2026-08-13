import type { Metadata } from "next";
import Link from "next/link";

import { BrandMark } from "../_components/public-shells";
import { WaitlistForm } from "../_components/waitlist-form";

export const metadata: Metadata = {
  title: "Join the waitlist | Cirqut",
  description: "Apply for the Cirqut private beta.",
};

export default function WaitlistPage() {
  return (
    <main className="auth-page waitlist-page">
      <header className="auth-header"><Link className="auth-brand-link" href="/" aria-label="Back to home"><BrandMark context="auth" /></Link><div className="auth-header-switch"><span>Already approved?</span><Link href="/login">Log in</Link></div></header>
      <div className="auth-shell">
        <section className="auth-context" aria-labelledby="waitlist-title">
          <div className="auth-context-copy"><p className="auth-eyebrow"><i />Private beta</p><h1 id="waitlist-title">Join the Cirqut waitlist.</h1><p className="auth-context-description">We’re building a clearer way to start, research, and review PCB projects. Tell us how you work so early access goes to useful test cases.</p></div>
          <div className="auth-feature-list"><div className="auth-feature"><span>01</span><div><h2>Plan</h2><p>Define requirements and surface missing decisions.</p></div></div><div className="auth-feature"><span>02</span><div><h2>Research</h2><p>Keep conclusions linked to relevant sources.</p></div></div><div className="auth-feature"><span>03</span><div><h2>Handoff</h2><p>Carry design context into review and implementation.</p></div></div></div>
        </section>
        <section className="auth-card waitlist-card" aria-labelledby="waitlist-form-title"><div className="auth-card-heading"><p>Request access</p><h2 id="waitlist-form-title">Tell us about your work</h2><span>No payment details. No public account is created.</span></div><WaitlistForm /></section>
      </div>
      <footer className="auth-footer"><span>© 2026</span><nav aria-label="Footer navigation"><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/">Back to home</Link></nav></footer>
    </main>
  );
}
