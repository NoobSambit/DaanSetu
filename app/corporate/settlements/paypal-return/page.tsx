"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type CaptureState = "capturing" | "success" | "pending" | "failed";

function SettlementReturnContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("token");
  const [state, setState] = useState<CaptureState>("capturing");

  useEffect(() => {
    if (!orderId) {
      setState("failed");
      return;
    }

    const controller = new AbortController();
    fetch("/api/csr/settlements/capture", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as { success?: boolean };
        if (response.ok && result.success) setState("success");
        else if (response.status === 202) setState("pending");
        else setState("failed");
      })
      .catch((error: unknown) => {
        if (error instanceof Error && error.name !== "AbortError") {
          setState("failed");
        }
      });

    return () => controller.abort();
  }, [orderId]);

  const copy = {
    capturing: ["Confirming the match settlement", "Checking PayPal capture…"],
    success: [
      "Settlement confirmed",
      "The matching pledges have been allocated as corporate donations.",
    ],
    pending: [
      "Capture still processing",
      "No matching pledge is allocated until PayPal confirms capture.",
    ],
    failed: [
      "Settlement not confirmed",
      "No pledge was allocated. Review settlement history before retrying.",
    ],
  }[state];

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <h1 className="text-3xl font-bold text-[#10214e]">{copy[0]}</h1>
      <p className="mt-4 text-slate-600">{copy[1]}</p>
      {state !== "capturing" && (
        <Link className="btn btn-primary mt-6" href="/corporate/settlements">
          View settlements
        </Link>
      )}
    </section>
  );
}

export default function PayPalSettlementReturnPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-16">
      <Suspense
        fallback={
          <p className="mx-auto max-w-xl text-center text-slate-600">
            Loading PayPal confirmation…
          </p>
        }
      >
        <SettlementReturnContent />
      </Suspense>
    </main>
  );
}
