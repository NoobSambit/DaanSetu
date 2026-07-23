import { RotateCcw } from "lucide-react";

import { PageHeader } from "@/components/ui/PagePrimitives";

export default function RefundPolicyPage() {
  return (
    <main className="page-frame">
      <section className="page-content max-w-3xl">
        <PageHeader
          eyebrow="Giving safeguards"
          title="Refund policy"
          description="Refund requests are reviewed against the campaign purpose, settlement state, and applicable PayPal rules."
        />
        <div className="panel space-y-4 p-6 text-slate-700 sm:p-8">
          <RotateCcw className="h-5 w-5 text-blue-700" aria-hidden="true" />
          <p>
            Donors may request a refund from their giving dashboard. Requests
            are reviewed against the campaign purpose, settlement state, and
            applicable PayPal rules.
          </p>
          <p>
            Approved refunds are returned through the original payment method.
            Processing time depends on PayPal and the donor&apos;s financial
            institution.
          </p>
          <p>Demo donations never move money and do not require refunds.</p>
        </div>
      </section>
    </main>
  );
}
