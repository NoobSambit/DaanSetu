"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type CancellationState = "releasing" | "cancelled" | "failed";

function SettlementCancelContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("token");
  const [state, setState] = useState<CancellationState>("releasing");

  useEffect(() => {
    if (!orderId) {
      setState("failed");
      return;
    }

    const controller = new AbortController();
    fetch("/api/csr/settlements/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, action: "cancel" }),
      signal: controller.signal,
    })
      .then((response) => setState(response.ok ? "cancelled" : "failed"))
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setState("failed");
        }
      });

    return () => controller.abort();
  }, [orderId]);

  const copy = {
    releasing: [
      "Cancelling settlement",
      "Returning unmatched pledges to the outstanding queue…",
    ],
    cancelled: [
      "Settlement cancelled",
      "No money was allocated. The pledges can be included in a later batch.",
    ],
    failed: [
      "Cancellation needs review",
      "Check settlement history before starting another payment.",
    ],
  }[state];

  return (
    <section
      className="panel mx-auto max-w-xl p-6 text-center sm:p-8"
      aria-live="polite"
    >
      <h1 className="text-3xl font-bold text-[#10214e]">{copy[0]}</h1>
      <p className="mt-4 text-slate-600">{copy[1]}</p>
      {state !== "releasing" && (
        <Link className="btn btn-primary mt-6" href="/corporate/settlements">
          View settlements
        </Link>
      )}
    </section>
  );
}

export default function PayPalSettlementCancelPage() {
  return (
    <main className="page-frame flex items-center justify-center">
      <Suspense
        fallback={
          <p className="mx-auto max-w-xl text-center text-slate-600">
            Loading settlement cancellation…
          </p>
        }
      >
        <SettlementCancelContent />
      </Suspense>
    </main>
  );
}
