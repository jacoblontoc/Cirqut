type BrandMarkProps = {
  context: "auth" | "legal";
};

export function BrandMark({ context }: BrandMarkProps) {
  return (
    <span className={`${context}-brand-mark`} aria-hidden="true">
      <i />
      <i />
      <i />
    </span>
  );
}

export type LegalSection = {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
};

type LegalPageProps = {
  documentLabel: string;
  title: string;
  summary: string;
  sections: LegalSection[];
};

export function LegalPage({ documentLabel, title, summary, sections }: LegalPageProps) {
  return (
    <main className="legal-page">
      <header className="legal-header">
        <Link className="legal-brand-link" href="/" aria-label="Back to home">
          <BrandMark context="legal" />
        </Link>
        <nav className="legal-header-nav" aria-label="Legal page navigation">
          <Link href="/">Home</Link>
          <Link href="/login">Log in</Link>
          <Link className="legal-header-action" href="/waitlist">Join waitlist</Link>
        </nav>
      </header>

      <section className="legal-hero" aria-labelledby="legal-title">
        <div className="legal-hero-label">
          <span>{documentLabel}</span>
          <strong>Draft</strong>
        </div>
        <div className="legal-hero-copy">
          <h1 id="legal-title">{title}</h1>
          <p>{summary}</p>
          <div className="legal-hero-meta">
            <span>Last updated August 12, 2026</span>
            <span>Version 0.2</span>
          </div>
        </div>
      </section>

      <div className="legal-draft-note" role="note">
        <strong>Pre-launch draft</strong>
        <p>This document is provided for product planning and must be reviewed by qualified counsel before public launch, paid accounts, or customer engineering data are accepted.</p>
      </div>

      <div className="legal-document-layout">
        <aside className="legal-toc" aria-label="On this page">
          <span>On this page</span>
          <ol>
            {sections.map((section, index) => (
              <li key={section.id}>
                <a href={`#${section.id}`}><b>{String(index + 1).padStart(2, "0")}</b>{section.title}</a>
              </li>
            ))}
          </ol>
        </aside>

        <article className="legal-document">
          {sections.map((section, index) => (
            <section className="legal-section" id={section.id} key={section.id}>
              <div className="legal-section-number">{String(index + 1).padStart(2, "0")}</div>
              <div className="legal-section-content">
                <h2>{section.title}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </article>
      </div>

      <footer className="legal-footer">
        <Link className="legal-footer-mark" href="/" aria-label="Back to home"><BrandMark context="legal" /></Link>
        <p>Public website legal drafts · 2026</p>
        <nav aria-label="Footer navigation">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/">Home</Link>
        </nav>
      </footer>
    </main>
  );
}
import Link from "next/link";
