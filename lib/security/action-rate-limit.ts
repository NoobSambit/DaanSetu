import "server-only";

import { createClient } from "@/lib/supabase/server";

type ActionRateLimit = {
  action: string;
  maximumHits: number;
  windowSeconds: number;
};

export async function enforceActionRateLimit({
  action,
  maximumHits,
  windowSeconds,
}: ActionRateLimit): Promise<void> {
  const supabase = await createClient();
  const { data: allowed, error } = await supabase.rpc(
    "consume_action_rate_limit",
    {
      action_name: action,
      maximum_hits: maximumHits,
      window_seconds: windowSeconds,
    },
  );

  if (error) {
    throw new Error("The request could not be rate limited safely");
  }
  if (!allowed) {
    throw new Error("Too many requests. Please wait before trying again");
  }
}
