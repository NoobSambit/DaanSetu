export default function RefundPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-[#10214e]">Refund policy</h1>
      <div className="mt-6 space-y-4 text-slate-700">
        <p>
          Donors may request a refund from their giving dashboard. Requests are
          reviewed against the campaign purpose, settlement state, and
          applicable PayPal rules.
        </p>
        <p>
          Approved refunds are returned through the original payment method.
          Processing time depends on PayPal and the donor&apos;s financial
          institution.
        </p>
        <p>Demo donations never move money and do not require refunds.</p>
      </div>
    </main>
  );
}
