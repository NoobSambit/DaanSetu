import { ShieldAlert } from "lucide-react";

import { PageHeader } from "@/components/ui/PagePrimitives";

export default function GrievancePage() {
  return (
    <main className="page-frame">
      <section className="page-content max-w-3xl">
        <PageHeader
          eyebrow="Trust and safety"
          title="Grievance support"
          description="Use your receipt or case identifier so the platform team can locate the right record quickly."
        />
        <div className="panel space-y-4 p-6 text-slate-700 sm:p-8">
          <ShieldAlert className="h-5 w-5 text-blue-700" aria-hidden="true" />
          <p>
            For payment, campaign, tax-document, or safeguarding concerns,
            contact the platform team with your receipt or case identifier.
          </p>
          <p>
            Never include passwords, payment credentials, identity-document
            copies, or private keys in a grievance message.
          </p>
        </div>
      </section>
    </main>
  );
}
