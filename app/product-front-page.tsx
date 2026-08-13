"use client";

import { useEffect, useState } from "react";

function BrandMark({ small = false }: { small?: boolean }) {
  return (
    <span className={small ? "brand-mark brand-mark--small" : "brand-mark"} aria-hidden="true">
      <i /><i /><i /><i />
    </span>
  );
}

const features = [
  {
    title: "Guided project setup",
    copy: "Define what the board needs to do, including power, interfaces, environment, cost, and size.",
  },
  {
    title: "Cross-document research",
    copy: "Review datasheets, errata, application notes, and reference designs. Keep important limits and conflicts linked to the source.",
  },
  {
    title: "Starter schematic",
    copy: "Turn approved requirements, parts, and design constraints into an editable starting point for detailed engineering.",
  },
  {
    title: "Project handoff",
    copy: "Prepare the design rationale, setup guidance, bring-up notes, and review material needed to keep the project moving.",
  },
];

const faqs = [
  ["Does it design and route the entire PCB?", "No. The product makes the early PCB process easier by helping teams set requirements, research sources, review decisions, and prepare an editable starting point. Detailed engineering, layout, validation, and final approval remain with the designer."],
  ["What does it generate?", "A project brief, a starter schematic, design rationale, verified source citations, a decision log, open questions, setup and bring-up guidance, and review-ready documentation for the board."],
  ["Can experienced engineers skip the guided steps?", "Yes. The workflow can be concise for teams that already know their requirements, while keeping deeper guidance available for unfamiliar parts or design domains."],
  ["How are citations verified?", "Claims are linked to exact passages in the uploaded source set. The product keeps source revision, page or section, and review status with each important decision."],
  ["Which schematic tools will be supported?", "KiCad is the first planned handoff and synchronization target. The generated starting point remains editable and owned by the engineering team."],
  ["Can teams use their own model or API key?", "That is part of the planned platform foundation. Team-managed providers and keys will sit behind shared permissions, usage controls, and audit history."],
];

export function ProductFrontPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(true);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    document.documentElement.classList.add("reveal-ready");

    if (!("IntersectionObserver" in window)) {
      nodes.forEach((node) => node.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          (entry.target as HTMLElement).classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <main id="top">
      <div className="announcement">
        <span>Private beta applications are open.</span>
        <a href="/waitlist">Join the waitlist <b>→</b></a>
      </div>

      <header className="site-header">
        <a className="logo-link" href="#top" aria-label="Home"><BrandMark /></a>
        <button className="menu-button" type="button" aria-label="Toggle navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen(!menuOpen)}><span /><span /></button>
        <nav className={menuOpen ? "main-nav main-nav--open" : "main-nav"} aria-label="Primary navigation">
          <a href="#features" onClick={() => setMenuOpen(false)}>Features</a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
          <a href="#pricing" onClick={() => setMenuOpen(false)}>Pricing</a>
          <a href="#faq" onClick={() => setMenuOpen(false)}>FAQ</a>
        </nav>
        <div className="header-actions">
          <a className="login-link" href="/login">Log in</a>
          <a className="button button--dark button--small" href="/waitlist">Join waitlist</a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <h1>PCB creation made easy.</h1>
          <div className="hero-actions">
            <a className="button button--dark button--large" href="/waitlist">Join waitlist <span>→</span></a>
            <a className="button button--light button--large" href="#features">Explore features</a>
          </div>
        </div>

        <figure className="hero-image">
          <img src="/hero-pcb-transparent-v2.png" alt="Abstract monochrome printed circuit board traces" fetchPriority="high" />
        </figure>
      </section>

      <section className="features-section" id="features">
        <div className="section-heading" data-reveal>
          <span>Features</span>
          <h2>Everything needed to get a PCB project moving.</h2>
          <p>Define requirements, research parts, review key decisions, and prepare the files and context needed for detailed design.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title} data-reveal>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="workflow-section" id="how-it-works">
        <div className="section-heading section-heading--left" data-reveal>
          <span>How it works</span>
          <h2>From an idea to a usable starting point.</h2>
          <p>Follow the guided path or begin with requirements your team already has.</p>
        </div>
        <div className="workflow-list" data-reveal>
          <article><span>1</span><div><h3>Set the requirements</h3><p>Add goals, source documents, preferred parts, and constraints. The system identifies missing information and asks clear follow-up questions.</p></div><b>Project brief</b></article>
          <article><span>2</span><div><h3>Research and review</h3><p>Inspect part choices, citations, conflicts, assumptions, and open questions before the project moves into detailed design.</p></div><b>Reviewed decisions</b></article>
          <article><span>3</span><div><h3>Continue the design</h3><p>Export editable project files with the rationale, setup guidance, bring-up notes, and review context your team needs.</p></div><b>Project handoff</b></article>
        </div>
      </section>

      <section className="pricing-section" id="pricing">
        <div className="section-heading" data-reveal>
          <span>Pricing</span>
          <h2>Plans for individual projects and engineering teams.</h2>
          <p>Preview pricing for the private beta. Final limits and prices may change before public launch.</p>
        </div>
        <div className="billing-toggle" role="group" aria-label="Billing frequency"><button className={!annual ? "active" : ""} onClick={() => setAnnual(false)}>Monthly</button><button className={annual ? "active" : ""} onClick={() => setAnnual(true)}>Annual <span>Save 20%</span></button></div>
        <div className="pricing-grid">
          <article className="price-card" data-reveal>
            <span className="plan-label">Starter</span><h3>$0</h3><p>For learning the workflow and planning a first project.</p><a className="button button--light button--full" href="/waitlist">Join waitlist</a>
            <ul><li>1 active project</li><li>Up to 25 source documents</li><li>1 starter schematic export</li><li>Core board documentation</li><li>Community support</li></ul>
          </article>
          <article className="price-card price-card--featured" data-reveal><div className="popular">Most popular</div>
            <span className="plan-label">Pro</span><h3>${annual ? "32" : "39"}<small>/ month</small></h3><p>For individual engineers building and documenting real projects.</p><a className="button button--dark button--full" href="/waitlist">Join waitlist</a>
            <ul><li>Unlimited personal projects</li><li>Up to 250 documents per project</li><li>Advanced citation and conflict checks</li><li>Unlimited schematic and document exports</li><li>Faster model processing</li></ul>
          </article>
          <article className="price-card" data-reveal>
            <span className="plan-label">Team</span><h3>${annual ? "28" : "35"}<small>/ user / month</small></h3><p>For engineering groups that review and maintain boards together.</p><a className="button button--light button--full" href="/waitlist">Join waitlist</a>
            <ul><li>Everything in Pro</li><li>Shared projects and review workflows</li><li>Decision ownership and revision history</li><li>Organization controls and usage reporting</li><li>Shared provider and API-key settings</li></ul>
          </article>
        </div>
        <div className="enterprise-bar"><strong>Enterprise</strong><a className="button button--light button--small" href="/contact">Contact sales <span>→</span></a></div>
      </section>

      <section className="faq-section" id="faq">
        <div className="section-heading section-heading--left" data-reveal><span>FAQ</span><h2>Common questions.</h2><p>More documentation will be published as the private beta develops.</p></div>
        <div className="faq-list" data-reveal>
          {faqs.map(([question, answer]) => <details key={question}><summary>{question}<span>+</span></summary><p>{answer}</p></details>)}
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-glow" />
        <BrandMark />
        <h2>Make your next PCB project easier to start and easier to review.</h2>
        <p>Join the private beta for guided setup, source-backed research, editable design files, and a complete project handoff.</p>
        <div><a className="button button--light button--large" href="/waitlist">Join the waitlist <span>→</span></a><a href="#pricing">Compare plans</a></div>
      </section>

      <footer className="site-footer">
        <div className="footer-main">
          <div className="footer-brand"><a href="#top" aria-label="Home"><BrandMark /></a><span>Private beta · 2026</span></div>
          <div className="footer-column"><h3>Product</h3><a href="#features">Features</a><a href="#how-it-works">How it works</a><a href="#pricing">Pricing</a><a href="#faq">FAQ</a></div>
          <div className="footer-column"><h3>Company</h3><a href="/waitlist">Private beta</a><a href="/contact">Contact</a><a href="/status">Changelog</a></div>
          <div className="footer-column"><h3>Resources</h3><a href="#faq">Documentation</a><a href="#how-it-works">Design guide</a><a href="#features">PCB glossary</a><a href="/status">System status</a></div>
          <div className="footer-column"><h3>Legal</h3><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="/security">Security</a><a href="/login">Log in</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026. All rights reserved.</span><div><a href="/contact">Contact</a><a href="/security">Security</a><a href="/status">Status</a></div></div>
      </footer>
    </main>
  );
}
