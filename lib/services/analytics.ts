import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

type FinancialDonation = {
  amount_paise: number;
  refunded_paise: number;
};

function netDonationPaise(donation: FinancialDonation): number {
  return Math.max(0, donation.amount_paise - donation.refunded_paise);
}

/**
 * Get platform-wide statistics
 */
export async function getPlatformStats(supabase: SupabaseClient) {
  const [ngosResult, campaignsResult, donationsResult, volunteersResult] =
    await Promise.all([
      supabase.from("ngos").select("id", { count: "exact", head: true }),
      supabase.from("campaigns").select("id", { count: "exact", head: true }),
      supabase.from("donations").select("id", { count: "exact", head: true }),
      supabase
        .from("volunteer_profiles")
        .select("id", { count: "exact", head: true }),
    ]);

  return {
    totalNGOs: ngosResult.count || 0,
    totalCampaigns: campaignsResult.count || 0,
    totalDonations: donationsResult.count || 0,
    totalVolunteers: volunteersResult.count || 0,
  };
}

/**
 * Get donations over time (for charts)
 */
export async function getDonationsOverTime(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("donations")
    .select("amount_paise, refunded_paise, captured_at")
    .in("status", ["captured", "partially_refunded", "refunded"])
    .eq("is_demo", false)
    .order("captured_at", { ascending: true });

  if (error) throw error;

  // Group by date
  const groupedByDate: Record<string, number> = {};

  data?.forEach((donation) => {
    const netPaise = netDonationPaise(donation);
    if (!donation.captured_at || netPaise === 0) return;
    const date = donation.captured_at.slice(0, 10);
    if (!groupedByDate[date]) {
      groupedByDate[date] = 0;
    }
    groupedByDate[date] += netPaise / 100;
  });

  return Object.entries(groupedByDate).map(([date, amount]) => ({
    date,
    amount,
  }));
}

/**
 * Get campaigns created over time
 */
export async function getCampaignsOverTime(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("campaigns")
    .select("created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Group by date
  const groupedByDate: Record<string, number> = {};

  data?.forEach((campaign) => {
    const date = new Date(campaign.created_at).toISOString().split("T")[0];
    if (!groupedByDate[date]) {
      groupedByDate[date] = 0;
    }
    groupedByDate[date] += 1;
  });

  return Object.entries(groupedByDate).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Get volunteer growth over time
 */
export async function getVolunteerGrowth(supabase: SupabaseClient) {
  const { data, error } = await supabase
    .from("volunteer_profiles")
    .select("created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;

  // Group by date
  const groupedByDate: Record<string, number> = {};
  let cumulative = 0;

  data?.forEach((profile) => {
    const date = new Date(profile.created_at).toISOString().split("T")[0];
    cumulative += 1;
    groupedByDate[date] = cumulative;
  });

  return Object.entries(groupedByDate).map(([date, count]) => ({
    date,
    count,
  }));
}

/**
 * Get NGO-specific analytics
 */
export async function getNGOAnalytics(ngoId: string, supabase: SupabaseClient) {
  // Get total funds received
  const { data: donations } = await supabase
    .from("donations")
    .select("amount_paise, refunded_paise, captured_at")
    .eq("ngo_id", ngoId)
    .in("status", ["captured", "partially_refunded", "refunded"])
    .eq("is_demo", false);

  const totalFundsPaise =
    donations?.reduce((sum, donation) => sum + netDonationPaise(donation), 0) ??
    0;

  // Get donations over time for this NGO
  const donationsOverTime: Record<string, number> = {};
  donations?.forEach((donation) => {
    const netPaise = netDonationPaise(donation);
    if (!donation.captured_at || netPaise === 0) return;
    const date = donation.captured_at.slice(0, 10);
    if (!donationsOverTime[date]) {
      donationsOverTime[date] = 0;
    }
    donationsOverTime[date] += netPaise;
  });

  const donationsTimeSeries = Object.entries(donationsOverTime).map(
    ([date, amount]) => ({
      date,
      amount: amount / 100,
    }),
  );

  // Get campaigns performance
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, title, target_paise, raised_paise, status")
    .eq("ngo_id", ngoId);

  // Get volunteer applications
  const { data: opportunities } = await supabase
    .from("volunteer_opportunities")
    .select("id")
    .eq("ngo_id", ngoId);

  const opportunityIds = opportunities?.map((o) => o.id) || [];

  let volunteerApplications = 0;
  if (opportunityIds.length > 0) {
    const { count } = await supabase
      .from("volunteer_applications")
      .select("id", { count: "exact", head: true })
      .in("opportunity_id", opportunityIds);

    volunteerApplications = count || 0;
  }

  return {
    totalFunds: totalFundsPaise / 100,
    donationsTimeSeries,
    campaigns: campaigns || [],
    activeCampaigns:
      campaigns?.filter((campaign) => campaign.status === "active").length ?? 0,
    volunteerApplications,
  };
}

/**
 * Get user impact analytics
 */
export async function getUserImpact(userId: string, supabase: SupabaseClient) {
  // Get user donations
  const { data: donations } = await supabase
    .from("donations")
    .select("amount_paise, refunded_paise, cause, captured_at, campaign_id")
    .eq("user_id", userId)
    .in("status", ["captured", "partially_refunded", "refunded"])
    .eq("is_demo", false)
    .eq("is_csr_match", false);

  const totalDonatedPaise =
    donations?.reduce((sum, donation) => sum + netDonationPaise(donation), 0) ??
    0;
  const campaignsSupported = new Set(
    donations
      ?.filter((donation) => netDonationPaise(donation) > 0)
      .map((donation) => donation.campaign_id)
      .filter(Boolean),
  ).size;

  // Donations by cause
  const donationsByCause: Record<string, number> = {};
  donations?.forEach((donation) => {
    const netPaise = netDonationPaise(donation);
    if (netPaise === 0) return;
    if (!donationsByCause[donation.cause]) {
      donationsByCause[donation.cause] = 0;
    }
    donationsByCause[donation.cause] += netPaise;
  });

  const causeBreakdown = Object.entries(donationsByCause).map(
    ([cause, amount]) => ({
      cause,
      amount: amount / 100,
    }),
  );

  // Donation history over time
  const donationsOverTime: Record<string, number> = {};
  donations?.forEach((donation) => {
    const netPaise = netDonationPaise(donation);
    if (!donation.captured_at || netPaise === 0) return;
    const date = donation.captured_at.slice(0, 10);
    if (!donationsOverTime[date]) {
      donationsOverTime[date] = 0;
    }
    donationsOverTime[date] += netPaise;
  });

  const donationsTimeSeries = Object.entries(donationsOverTime).map(
    ([date, amount]) => ({
      date,
      amount: amount / 100,
    }),
  );

  // Get volunteer applications
  const { count: volunteerApplications } = await supabase
    .from("volunteer_applications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  return {
    totalDonated: totalDonatedPaise / 100,
    campaignsSupported,
    volunteerApplications: volunteerApplications || 0,
    causeBreakdown,
    donationsTimeSeries,
  };
}

/**
 * Get admin analytics
 */
export async function getAdminAnalytics(supabase: SupabaseClient) {
  // Donations by region (NGO city/state)
  const { data: donationsWithNGO } = await supabase
    .from("donations")
    .select(
      `
      amount_paise,
      refunded_paise,
      ngos (city, state)
    `,
    )
    .in("status", ["captured", "partially_refunded", "refunded"])
    .eq("is_demo", false);

  const donationsByRegion: Record<string, number> = {};
  donationsWithNGO?.forEach((donation: any) => {
    const region = donation.ngos?.city || "Unknown";
    if (!donationsByRegion[region]) {
      donationsByRegion[region] = 0;
    }
    donationsByRegion[region] += netDonationPaise(donation) / 100;
  });

  const regionData = Object.entries(donationsByRegion)
    .map(([region, amount]) => ({ region, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Campaign activity by category
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("category");

  const campaignsByCategory: Record<string, number> = {};
  campaigns?.forEach((campaign) => {
    if (!campaignsByCategory[campaign.category]) {
      campaignsByCategory[campaign.category] = 0;
    }
    campaignsByCategory[campaign.category] += 1;
  });

  const categoryData = Object.entries(campaignsByCategory).map(
    ([category, count]) => ({
      category,
      count,
    }),
  );

  // Top NGOs by donations
  const { data: topNGOsByDonations } = await supabase
    .from("donations")
    .select(
      `
      amount_paise,
      refunded_paise,
      ngo_id,
      ngos (name)
    `,
    )
    .in("status", ["captured", "partially_refunded", "refunded"])
    .eq("is_demo", false);

  const ngoTotals: Record<string, { name: string; total: number }> = {};
  topNGOsByDonations?.forEach((donation: any) => {
    const ngoId = donation.ngo_id;
    const ngoName = donation.ngos?.name || "Unknown";
    if (!ngoTotals[ngoId]) {
      ngoTotals[ngoId] = { name: ngoName, total: 0 };
    }
    ngoTotals[ngoId].total += netDonationPaise(donation) / 100;
  });

  const topNGOs = Object.entries(ngoTotals)
    .map(([id, data]) => ({ id, name: data.name, total: data.total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // AI Flags summary
  const { count: totalFlags } = await supabase
    .from("ai_flags")
    .select("id", { count: "exact", head: true });

  const { count: highConfidenceFlags } = await supabase
    .from("ai_flags")
    .select("id", { count: "exact", head: true })
    .eq("confidence", "high");

  return {
    donationsByRegion: regionData,
    campaignsByCategory: categoryData,
    topNGOs,
    aiFlags: {
      total: totalFlags || 0,
      highConfidence: highConfidenceFlags || 0,
    },
  };
}

/**
 * Export NGO impact report as CSV data
 */
export async function exportNGOReport(ngoId: string, supabase: SupabaseClient) {
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("title, target_paise, raised_paise, created_at, deadline")
    .eq("ngo_id", ngoId);

  const { data: opportunities } = await supabase
    .from("volunteer_opportunities")
    .select("id, title, created_at")
    .eq("ngo_id", ngoId);

  const reportData = [];

  for (const campaign of campaigns || []) {
    reportData.push({
      type: "Campaign",
      title: campaign.title,
      goal: campaign.target_paise / 100,
      raised: campaign.raised_paise / 100,
      created: new Date(campaign.created_at).toLocaleDateString(),
      deadline: new Date(campaign.deadline).toLocaleDateString(),
    });
  }

  for (const opportunity of opportunities || []) {
    const { count } = await supabase
      .from("volunteer_applications")
      .select("id", { count: "exact", head: true })
      .eq("opportunity_id", opportunity.id);

    reportData.push({
      type: "Volunteer Opportunity",
      title: opportunity.title,
      applications: count || 0,
      created: new Date(opportunity.created_at).toLocaleDateString(),
    });
  }

  return reportData;
}
