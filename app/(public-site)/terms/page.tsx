import type { Metadata } from "next";
import { LegalPage, type LegalSection } from "../_components/public-shells";

export const metadata: Metadata = {
  title: "Terms of service | Cirqut",
  description: "Draft terms for the Cirqut public website and service.",
};

const sections: LegalSection[] = [
  {
    id: "draft-status",
    title: "Draft status and agreement",
    paragraphs: [
      "These terms are a product-planning draft and are not ready to govern a production service. They must be reviewed and issued by the final operating entity before accounts, subscriptions, or customer data are accepted.",
      "The issued terms should explain that using the service creates an agreement between the customer and the named operating entity. If a person uses the service for an organization, that person must have authority to accept the agreement on the organization’s behalf.",
    ],
  },
  {
    id: "service",
    title: "Service scope",
    paragraphs: [
      "The planned service helps users research PCB source documents, record engineering decisions, create a starter schematic, and prepare board-specific documentation and review material. Features, limits, supported file formats, and availability may change as the product develops.",
      "The service is an engineering-assistance and documentation tool. It is not a PCB autorouter, certification authority, component manufacturer, test laboratory, or substitute for qualified engineering review.",
    ],
  },
  {
    id: "accounts",
    title: "Accounts and workspace administration",
    paragraphs: [
      "Users must provide accurate account information, protect authentication credentials, and promptly report suspected unauthorized access. Workspace owners are responsible for inviting authorized users, setting appropriate roles, and managing access when team members change roles or leave.",
      "The final terms should define minimum age, account eligibility, trial access, administrator authority, verification procedures, and responsibility for activity performed through an account.",
    ],
  },
  {
    id: "responsibility",
    title: "Engineering responsibility",
    paragraphs: [
      "Users remain responsible for reviewing every output and making final engineering decisions. Before fabrication or use, qualified personnel should verify component selection, electrical ratings, safety margins, pin assignments, power architecture, protection, regulatory requirements, manufacturability, and test plans.",
      "Source citations and conflict flags can support review but do not guarantee that source documents are current, complete, or correctly interpreted. Users should verify critical information against authoritative manufacturer and standards-body materials.",
    ],
  },
  {
    id: "content",
    title: "Customer content and generated output",
    paragraphs: [
      "Customers should retain ownership of the requirements, documents, schematics, notes, decisions, and other content they submit. They should grant the service only the rights needed to host, process, transmit, and display that content to provide the requested service.",
      "Subject to third-party rights and applicable law, customers should be able to use generated output for their projects. Because model output may not be unique, similar output may be produced for other customers. The final terms must address feedback, exports, backups, and deletion after termination.",
    ],
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    paragraphs: [
      "Users must not misuse the service, interfere with its operation, attempt unauthorized access, evade usage limits, distribute malware, violate law or third-party rights, or use the service to develop prohibited or unlawfully harmful systems.",
      "Users must have the necessary rights to upload and process their content, including datasheets, standards, reference designs, schematics, and confidential materials. Reasonable security testing should occur only under an authorized disclosure or testing program.",
    ],
  },
  {
    id: "third-parties",
    title: "Third-party services and models",
    paragraphs: [
      "The service may connect to authentication, storage, model, payment, version-control, and EDA providers. Third-party services may have separate terms and privacy practices. The final product should clearly identify which third parties receive customer content for each enabled feature.",
      "When customers use their own API credentials or model account, they are responsible for that third-party account, its fees, permissions, and terms. The service remains responsible for protecting stored credentials according to its published security commitments.",
    ],
  },
  {
    id: "billing",
    title: "Plans, billing, and cancellation",
    paragraphs: [
      "Before paid plans launch, the final terms should state prices, included usage, overage treatment, billing frequency, taxes, renewal behavior, trial conversion, refund rules, cancellation timing, and what happens to workspace data after cancellation.",
      "Any enterprise order form or data-processing addendum should control over conflicting standard terms for the subjects it specifically addresses.",
    ],
  },
  {
    id: "warranties",
    title: "Availability, warranties, and liability",
    paragraphs: [
      "The final terms should describe support and availability commitments, maintenance, beta features, and circumstances in which access may be suspended. Any warranty disclaimers and liability limits must be appropriate for the customer type, governing law, and risks of hardware-design assistance.",
      "The issued agreement should not exclude liability that cannot legally be excluded. Separate enterprise terms may be needed for service levels, security commitments, indemnities, insurance, export controls, and regulated or safety-critical use.",
    ],
  },
  {
    id: "termination",
    title: "Suspension, termination, and changes",
    paragraphs: [
      "Access may need to be suspended to address security threats, legal requirements, nonpayment, or material violations. The final terms should include notice and cure periods where appropriate, explain termination rights, and provide a reasonable export window for customer content.",
      "Material term changes should be communicated before taking effect when required. The governing law, dispute process, venue, notice address, operating entity, and support contact remain to be selected and added before launch.",
    ],
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      documentLabel="Terms of service"
      title="Clear operating terms for an engineering workspace."
      summary="A practical pre-launch draft covering accounts, engineering responsibility, customer content, providers, billing, and service risk."
      sections={sections}
    />
  );
}
