import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "../_components/public-shells";

export const metadata: Metadata = { title: "Prototype status | Cirqut", description: "Current status of the Cirqut public-site and platform foundation." };

const sections: LegalSection[] = [
  { id: "website", title: "Public website", paragraphs: ["The marketing site, pricing, FAQ, waitlist, login, contact, legal, security, and status surfaces are implemented as a working concept. Design and pricing remain provisional."] },
  { id: "accounts", title: "Accounts and authentication", paragraphs: ["Managed Better Auth integration is scaffolded for existing-account email login. Public account creation and social login are intentionally closed during the waitlist phase. Production OAuth, SMTP, trusted domains, and enterprise SSO are not enabled yet."] },
  { id: "platform", title: "Platform services", paragraphs: ["The Cirqut Vercel project is linked locally. Neon database and auth provisioning still require a standalone Neon-owned organization and the Neon-managed Vercel connection. Until that is complete, form APIs return a clear unavailable response instead of pretending to save data."] },
  { id: "product", title: "PCB workflow", paragraphs: ["Guided board setup, source-document analysis, schematic generation, collaboration, and EDA synchronization have not been implemented. This phase covers the public site, identity boundary, waitlist, tenancy, entitlement, and audit foundations only."] },
];

export default function StatusPage() { return <LegalPage documentLabel="Prototype status" title="What is ready and what remains." summary="A current inventory of the public concept, platform foundation, and intentionally unbuilt product work." sections={sections} />; }
