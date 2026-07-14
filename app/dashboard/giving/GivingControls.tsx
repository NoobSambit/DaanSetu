"use client";

import { useState } from "react";

export function SubscriptionControls({
  subscriptionId,
  status,
}: {
  subscriptionId: string;
  status: string;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function change(action: "pause" | "resume" | "cancel") {
    setBusy(true);
    setMessage(null);
    try {
      const response = await fetch("/api/payment/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, subscriptionId }),
      });
      const result = (await response.json()) as {
        error?: string;
        status?: string;
      };
      setMessage(
        response.ok
          ? `Subscription is now ${result.status}.`
          : (result.error ?? "Subscription could not be updated."),
      );
    } catch {
      setMessage("Subscription could not be updated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {status === "active" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => change("pause")}
            className="btn btn-secondary"
          >
            Pause
          </button>
        )}
        {status === "paused" && (
          <button
            type="button"
            disabled={busy}
            onClick={() => change("resume")}
            className="btn btn-secondary"
          >
            Resume
          </button>
        )}
        {!["cancelled", "completed", "expired"].includes(status) && (
          <button
            type="button"
            disabled={busy}
            onClick={() => change("cancel")}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        )}
      </div>
      {message && (
        <p aria-live="polite" className="mt-2 text-xs text-slate-600">
          {message}
        </p>
      )}
    </div>
  );
}
