import type { SupabaseClient } from "@supabase/supabase-js";

import { getBrowserClient } from "@/lib/supabase";
import type { DonationCause } from "@/lib/types/database.types";

export interface CreateDonationParams {
  campaignId: string;
  amountPaise: number;
}

export async function createDonation(params: CreateDonationParams) {
  const response = await fetch("/api/payment/create-order", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const result = (await response.json()) as {
    orderId?: string;
    approvalUrl?: string | null;
    error?: string;
  };
  if (!response.ok || !result.orderId) {
    throw new Error(result.error ?? "PayPal order could not be created");
  }
  return result;
}

export interface DonationWithNGO {
  id: string;
  amount_paise: number;
  cause: DonationCause;
  is_anonymous: boolean;
  status: string;
  created_at: string;
  ngo: {
    id: string;
    name: string;
    category: string;
  };
}

export async function getUserDonations(
  supabaseClient?: SupabaseClient,
): Promise<DonationWithNGO[]> {
  const supabase = supabaseClient ?? getBrowserClient();
  const { data, error } = await supabase
    .from("donations")
    .select(
      "id, amount_paise, cause, is_anonymous, status, created_at, ngo:ngos(id, name, category)",
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as unknown as DonationWithNGO[];
}

export async function getDonationStats(supabaseClient?: SupabaseClient) {
  const donations = await getUserDonations(supabaseClient);
  const captured = donations.filter(
    (donation) => donation.status === "captured",
  );
  return {
    totalAmountPaise: captured.reduce(
      (sum, donation) => sum + donation.amount_paise,
      0,
    ),
    totalDonations: captured.length,
  };
}
