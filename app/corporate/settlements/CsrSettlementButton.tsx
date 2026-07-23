"use client";

import { useState } from "react";

export default function CsrSettlementButton({
  pledgeIds,
}: {
  pledgeIds: string[];
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSettlement() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/csr/settlements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pledgeIds }),
      });
      const result = (await response.json()) as {
        approvalUrl?: string | null;
        error?: string;
      };
      if (!response.ok || !result.approvalUrl) {
        throw new Error(result.error ?? "PayPal approval is unavailable");
      }
      window.location.assign(result.approvalUrl);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The settlement could not be started",
      );
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        className="btn btn-primary"
        disabled={busy || pledgeIds.length === 0}
        onClick={startSettlement}
        type="button"
      >
        {busy ? "Opening PayPal…" : "Settle all with PayPal"}
      </button>
      {error && (
        <p aria-live="polite" className="mt-2 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
