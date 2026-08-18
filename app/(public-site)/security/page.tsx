import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "../_components/public-shells";

export const metadata: Metadata = { title: "Security planning | Cirqut", description: "Pre-launch security planning for Cirqut." };

const sections: LegalSection[] = [
  { id: "status", title: "Current status", paragraphs: ["The current project contains a public website, waitlist and contact endpoints, managed account authentication, a separate private-beta invite gate, and database schema foundations. Preview authentication is being validated before production is enabled.", "No security certification, compliance status, uptime target, or production control is claimed on this page."] },
  { id: "identity", title: "Identity and access", paragraphs: ["The launch design uses Neon Managed Better Auth for verified email, Google, and GitHub identity, with separate application-level beta access and organization authorization. Enterprise SSO requires a future provider boundary because Neon does not currently document native enterprise SAML or OIDC support."], bullets: ["Require verified identity before accepting an invite key.", "Keep product access separate from public account creation.", "Log membership, role, access-grant, export, and destructive changes."] },
  { id: "public-data", title: "Waitlist and contact data", paragraphs: ["Public forms validate and limit input, use a bot honeypot, require same-origin browser submissions, avoid storing raw IP addresses, and return generic success states for repeated waitlist emails.", "A production launch still needs rate limiting, retention procedures, operator access controls, deletion tooling, and counsel-approved disclosures."] },
  { id: "data", title: "Future engineering data", paragraphs: ["Uploaded source documents, generated design files, rationale, and review history should be encrypted in transit and at rest, isolated by organization, and covered by documented retention and deletion controls. None of those product-data paths exist in this phase."] },
  { id: "launch", title: "Required before launch", paragraphs: ["Before production account creation or customer engineering data, complete threat modeling, dependency and secret scanning, backup and restore tests, tenant-isolation tests, incident response procedures, provider reviews, and an independent security review."] },
];

export default function SecurityPage() { return <LegalPage documentLabel="Security planning" title="Security decisions to complete before launch." summary="A transparent outline for identity, public-form data, future engineering files, and launch readiness." sections={sections} />; }
