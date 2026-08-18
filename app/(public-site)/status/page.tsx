import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "../_components/public-shells";

export const metadata: Metadata = { title: "Prototype status | Cirqut", description: "Current status of the Cirqut public-site and platform foundation." };

const sections: LegalSection[] = [
  { id: "website", title: "Public website", paragraphs: ["The marketing site, pricing, FAQ, waitlist, login, contact, legal, security, and status surfaces are implemented as a working concept. Design and pricing remain provisional."] },
  { id: "accounts", title: "Accounts and authentication", paragraphs: ["Email/password signup, verification, password reset, and Google/GitHub entry points are implemented for Preview validation. Verified identity remains separate from private-beta access, which requires a one-time invite key. Production OAuth and enterprise SSO are not enabled yet."] },
  { id: "platform", title: "Platform services", paragraphs: ["The Cirqut Vercel project, cirqut.org domain, Neon database, and Managed Better Auth foundation are connected. Preview Auth configuration and invite redemption still require final external setup and end-to-end validation before hosted account creation opens."] },
  { id: "product", title: "PCB workflow", paragraphs: ["Guided board setup, source-document analysis, schematic generation, collaboration, and EDA synchronization have not been implemented. This phase covers the public site, identity boundary, waitlist, tenancy, entitlement, and audit foundations only."] },
];

export default function StatusPage() { return <LegalPage documentLabel="Prototype status" title="What is ready and what remains." summary="A current inventory of the public concept, platform foundation, and intentionally unbuilt product work." sections={sections} />; }
