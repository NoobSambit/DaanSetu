import { getBrowserClient } from "@/lib/supabase";
import type { DonationCause } from "@/lib/types/database.types";
import { incrementCampaignAmount } from "./campaigns";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CreateDonationParams {
  ngoId: string;
  amount: number;
  cause: DonationCause;
  isAnonymous: boolean;
  campaignId?: string;
  corporateCampaignId?: string;
}

export interface DonationWithNGO {
  id: string;
  amount: number;
  cause: DonationCause;
  is_anonymous: boolean;
  created_at: string;
  ngo: {
    id: string;
    name: string;
    category: string;
  };
}

/**
 * Process payment through Razorpay
 * This is a placeholder - actual implementation should be in an API route for security
 */
export async function processPayment(
  amount: number,
  orderId: string,
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  // This should be replaced with actual Razorpay integration
  // Payment processing should happen server-side via API routes
  console.warn("Payment processing not yet implemented - using simulation");

  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // For now, simulate success
  return {
    success: true,
    transactionId: `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
  };
}

export async function createDonation(
  params: CreateDonationParams,
  supabaseClient?: SupabaseClient,
) {
  const supabase = supabaseClient || getBrowserClient();

  // Get current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be logged in to donate");
  }

  // Validate amount
  if (params.amount <= 0) {
    throw new Error("Donation amount must be greater than 0");
  }

  if (params.amount > 10000000) {
    throw new Error("Donation amount cannot exceed ₹1,00,00,000");
  }

  // Create order ID for payment
  const orderId = `order_${Date.now()}_${user.id.substring(0, 8)}`;

  // Process payment
  const paymentResult = await processPayment(params.amount, orderId);

  if (!paymentResult.success) {
    throw new Error(paymentResult.error || "Payment failed");
  }

  // Create donation record with transaction ID
  const { data, error } = await supabase
    .from("donations")
    .insert({
      user_id: user.id,
      ngo_id: params.ngoId,
      campaign_id: params.campaignId || null,
      corporate_campaign_id: params.corporateCampaignId || null,
      amount: params.amount,
      cause: params.cause,
      is_anonymous: params.isAnonymous,
      payment_status: "completed",
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  // If this donation is for a campaign, increment the campaign amount atomically
  if (params.campaignId) {
    const { error: campaignError } = await supabase.rpc(
      "increment_campaign_amount",
      {
        campaign_id: params.campaignId,
        amount_to_add: params.amount,
      },
    );
    if (campaignError) {
      console.error("Failed to update campaign amount:", campaignError);
      // Log error but don't throw - donation was successful
    }
  }

  // If this donation is for a corporate campaign, increment the amount atomically
  if (params.corporateCampaignId) {
    const { error: campaignError } = await supabase.rpc(
      "increment_corporate_campaign_amount",
      {
        campaign_id: params.corporateCampaignId,
        amount_to_add: params.amount,
      },
    );
    if (campaignError) {
      console.error(
        "Failed to update corporate campaign amount:",
        campaignError,
      );
      // Log error but don't throw - donation was successful
    }
  }

  return data;
}

export async function getUserDonations(
  supabaseClient?: SupabaseClient,
): Promise<DonationWithNGO[]> {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase
    .from("donations")
    .select(
      `
      id,
      amount,
      cause,
      is_anonymous,
      created_at,
      ngo:ngos(id, name, category)
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data as unknown as DonationWithNGO[];
}

export async function getDonationStats(supabaseClient?: SupabaseClient) {
  const supabase = supabaseClient || getBrowserClient();

  const { data, error } = await supabase.from("donations").select("amount");

  if (error) {
    throw error;
  }

  const totalAmount = data.reduce((sum, donation) => sum + donation.amount, 0);
  const totalDonations = data.length;

  return {
    totalAmount,
    totalDonations,
  };
}
