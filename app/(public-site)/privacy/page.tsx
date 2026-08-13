import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "../_components/public-shells";

export const metadata: Metadata = {
  title: "Privacy notice | Cirqut",
  description: "Draft privacy notice for the Cirqut public website and service.",
};

const sections: LegalSection[] = [
  {
    id: "scope",
    title: "Scope and status",
    paragraphs: [
      "This draft describes the intended privacy practices for the public website, waitlist, contact intake, approved-account sign-in, and the future hosted PCB-creation service. The product workspace itself has not been implemented.",
      "Before launch, this notice should be updated with the legal entity responsible for the service, its contact details, the jurisdictions in which it operates, and the final list of infrastructure and model providers.",
    ],
  },
  {
    id: "information",
    title: "Information we may collect",
    paragraphs: [
      "When production services are enabled, information may be collected directly from users, automatically from their devices, and from integrations a workspace administrator chooses to connect.",
    ],
    bullets: [
      "Account information such as name, work email, organization, role, authentication identifiers, and workspace membership.",
      "Waitlist and contact information such as email, name, organization, role, project context, communication preferences, and inquiry history.",
      "Workspace content such as requirements, datasheets, errata, app notes, reference designs, notes, decisions, citations, review comments, schematic files, and generated documentation.",
      "Configuration information such as integration settings, model preferences, and whether a workspace uses its own API credentials.",
      "Technical and usage information such as IP address, browser type, device information, request logs, feature activity, error reports, and security events.",
      "Billing and subscription records. Payment-card details should be handled by a payment processor and not stored directly by the service.",
    ],
  },
  {
    id: "use",
    title: "How information may be used",
    paragraphs: [
      "Information may be used to provide and secure the service, process user requests, operate workspaces, generate requested outputs, maintain revision history, provide support, administer subscriptions, communicate service changes, and comply with law.",
      "Aggregated or de-identified information may be used to understand reliability and improve the service when it cannot reasonably be linked back to a person or workspace.",
    ],
  },
  {
    id: "models",
    title: "AI models and API credentials",
    paragraphs: [
      "The service is expected to route selected workspace content to model providers only when needed to perform a user-requested task. Before launch, the product should identify available providers, applicable data-processing terms, retention behavior, and regional controls.",
      "If a workspace brings its own model or API key, credentials should be encrypted, access-controlled, never displayed after entry, and used only for the workspace’s authorized requests. Customer content should not be used to train shared models unless an authorized customer representative explicitly opts in under clearly stated terms.",
    ],
  },
  {
    id: "sharing",
    title: "Sharing and service providers",
    paragraphs: [
      "Information may be shared with infrastructure, authentication, database, model, observability, support, and payment providers that process data on the service’s behalf. It may also be shared when a workspace user deliberately exports content or connects an integration.",
      "Information may be disclosed when reasonably necessary to comply with law, respond to valid legal process, protect users or the service, investigate abuse, or complete a corporate transaction subject to appropriate safeguards.",
    ],
  },
  {
    id: "retention",
    title: "Storage, security, and retention",
    paragraphs: [
      "The production service should use reasonable administrative, technical, and organizational safeguards, including encryption in transit and at rest, access controls, audit logging, backups, and incident response procedures. No system can guarantee absolute security.",
      "Account and workspace information should be retained while an account is active and for a limited period afterward when needed for recovery, security, legal obligations, or dispute resolution. Final retention periods, backup deletion windows, and data-residency options must be documented before launch.",
    ],
  },
  {
    id: "choices",
    title: "Access, deletion, and user choices",
    paragraphs: [
      "Subject to applicable law and workspace controls, users may be able to access, correct, export, or delete personal information. Workspace administrators may control membership, connected services, retention settings, and deletion of shared workspace content.",
      "Production contact and request-verification procedures must be added before personal data is accepted. Marketing communications should always include an unsubscribe method; essential account and security messages may still be sent.",
    ],
  },
  {
    id: "updates",
    title: "Children, changes, and contact",
    paragraphs: [
      "The service is intended for professional and educational hardware-design work and not for children under 13. If applicable law requires a higher minimum age, that higher age should apply.",
      "This notice may be updated as the service, providers, and legal requirements change. Material changes should be communicated through the website, the product, or email before they take effect when required.",
      "The operating entity, postal address, privacy email, data-protection contact, and any regional representative details remain to be added before launch.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      documentLabel="Privacy notice"
      title="How product and workspace data should be handled."
      summary="A practical pre-launch draft covering account data, engineering source material, AI processing, retention, and user controls."
      sections={sections}
    />
  );
}
