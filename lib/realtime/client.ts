import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

type RealtimeOptions = {
  table: "notifications" | "donations" | "campaigns" | "volunteer_applications";
  filter?: string;
  onChange: () => void;
  poll: () => Promise<void>;
  pollingIntervalMs?: number;
};

export function subscribeWithPollingFallback(
  supabase: SupabaseClient,
  options: RealtimeOptions,
): () => void {
  let pollingTimer: ReturnType<typeof setInterval> | undefined;
  let channel: RealtimeChannel | undefined;

  const startPolling = () => {
    if (pollingTimer) return;
    void options.poll();
    pollingTimer = setInterval(
      () => void options.poll(),
      options.pollingIntervalMs ?? 15_000,
    );
  };

  channel = supabase
    .channel(`live:${options.table}:${options.filter ?? "all"}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: options.table,
        filter: options.filter,
      },
      options.onChange,
    )
    .subscribe((status) => {
      if (status === "SUBSCRIBED" && pollingTimer) {
        clearInterval(pollingTimer);
        pollingTimer = undefined;
      } else if (
        status === "CHANNEL_ERROR" ||
        status === "TIMED_OUT" ||
        status === "CLOSED"
      ) {
        startPolling();
      }
    });

  const connectionDeadline = setTimeout(startPolling, 5_000);
  return () => {
    clearTimeout(connectionDeadline);
    if (pollingTimer) clearInterval(pollingTimer);
    if (channel) void supabase.removeChannel(channel);
  };
}
