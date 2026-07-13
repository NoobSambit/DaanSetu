import { getBrowserClient } from "@/lib/supabase";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface CorporateAnalytics {
  totalDonations: number;
  totalCampaigns: number;
  ngosSupported: number;
  employeesEngaged: number;
  donationsOverTime: Array<{ date: string; amount: number }>;
  campaignFundingOverTime: Array<{
    name: string;
    amount: number;
    goal: number;
  }>;
}

export async function getCorporateAnalytics(
  corporateId: string,
  supabaseClient?: SupabaseClient,
): Promise<CorporateAnalytics> {
  const supabase = supabaseClient || getBrowserClient();

  const [
    { data: donations, error: donationsError },
    { data: campaigns, error: campaignsError },
    { data: employees, error: employeesError },
  ] = await Promise.all([
    supabase
      .from("donations")
      .select("amount, created_at, ngo_id, corporate_campaign_id")
      .not("corporate_campaign_id", "is", null)
      .order("created_at", { ascending: true }),
    supabase
      .from("corporate_campaigns")
      .select("id, title, current_amount, goal_amount, created_at")
      .eq("corporate_id", corporateId)
      .order("created_at", { ascending: false }),
    supabase
      .from("corporate_employees")
      .select("id")
      .eq("corporate_id", corporateId),
  ]);

  if (donationsError) throw donationsError;
  if (campaignsError) throw campaignsError;
  if (employeesError) throw employeesError;

  const corporateCampaignIds = campaigns?.map((c) => c.id) || [];

  const relevantDonations =
    donations?.filter((d) =>
      corporateCampaignIds.includes(d.corporate_campaign_id || ""),
    ) || [];

  const totalDonations = relevantDonations.reduce(
    (sum, d) => sum + Number(d.amount),
    0,
  );

  const uniqueNGOs = new Set(relevantDonations.map((d) => d.ngo_id));
  const ngosSupported = uniqueNGOs.size;

  const donationsOverTime = relevantDonations.reduce((acc: any[], donation) => {
    const date = new Date(donation.created_at).toISOString().split("T")[0];
    const existing = acc.find((item) => item.date === date);

    if (existing) {
      existing.amount += Number(donation.amount);
    } else {
      acc.push({ date, amount: Number(donation.amount) });
    }

    return acc;
  }, []);

  const campaignFundingOverTime =
    campaigns?.slice(0, 10).map((campaign) => ({
      name:
        campaign.title.length > 20
          ? campaign.title.substring(0, 20) + "..."
          : campaign.title,
      amount: Number(campaign.current_amount),
      goal: Number(campaign.goal_amount),
    })) || [];

  return {
    totalDonations,
    totalCampaigns: campaigns?.length || 0,
    ngosSupported,
    employeesEngaged: employees?.length || 0,
    donationsOverTime,
    campaignFundingOverTime,
  };
}
