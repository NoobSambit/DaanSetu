import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type PublicImpactAnalytics = {
  metrics: {
    publishedNgos: number;
    activeCampaigns: number;
    netFundsPaise: number;
    capturedGifts: number;
    volunteers: number;
    approvedVolunteerHours: number;
    statesReached: number;
  };
  donationsOverTime: Array<{ date: string; amount: number }>;
  campaignsOverTime: Array<{ date: string; count: number }>;
  volunteersOverTime: Array<{ date: string; count: number }>;
};

function addToDate(map: Map<string, number>, date: string, value: number) {
  map.set(date, (map.get(date) ?? 0) + value);
}

function sortedSeries(map: Map<string, number>) {
  return [...map.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, value]) => ({ date, value }));
}

export async function getPublicImpactAnalytics(): Promise<PublicImpactAnalytics> {
  const admin = createAdminClient();
  const [donations, ngos, campaigns, volunteers, hours] = await Promise.all([
    admin
      .from("donations")
      .select("amount_paise, refunded_paise, captured_at, status, is_demo")
      .eq("is_demo", false)
      .in("status", ["captured", "partially_refunded", "refunded"]),
    admin
      .from("ngos")
      .select("state, operating_states")
      .eq("profile_status", "published")
      .eq("is_discoverable", true),
    admin
      .from("campaigns")
      .select("status, created_at")
      .in("status", ["active", "completed"])
      .not("published_at", "is", null),
    admin.from("volunteer_profiles").select("created_at"),
    admin.from("volunteer_hours").select("hours").eq("status", "approved"),
  ]);

  if (
    donations.error ||
    ngos.error ||
    campaigns.error ||
    volunteers.error ||
    hours.error
  ) {
    throw new Error("Public impact aggregates could not be loaded");
  }

  const donationDates = new Map<string, number>();
  let netFundsPaise = 0;
  let capturedGifts = 0;
  for (const donation of donations.data ?? []) {
    const netPaise = Math.max(
      0,
      donation.amount_paise - donation.refunded_paise,
    );
    netFundsPaise += netPaise;
    if (netPaise > 0) capturedGifts += 1;
    if (netPaise > 0 && donation.captured_at) {
      addToDate(
        donationDates,
        donation.captured_at.slice(0, 10),
        netPaise / 100,
      );
    }
  }

  const campaignDates = new Map<string, number>();
  for (const campaign of campaigns.data ?? []) {
    addToDate(campaignDates, campaign.created_at.slice(0, 10), 1);
  }

  const volunteerDates = new Map<string, number>();
  for (const volunteer of volunteers.data ?? []) {
    addToDate(volunteerDates, volunteer.created_at.slice(0, 10), 1);
  }
  let cumulativeVolunteers = 0;
  const volunteersOverTime = sortedSeries(volunteerDates).map((entry) => {
    cumulativeVolunteers += entry.value;
    return { date: entry.date, count: cumulativeVolunteers };
  });

  const states = new Set<string>();
  for (const ngo of ngos.data ?? []) {
    if (ngo.state) states.add(ngo.state);
    for (const state of ngo.operating_states ?? []) states.add(state);
  }

  return {
    metrics: {
      publishedNgos: ngos.data?.length ?? 0,
      activeCampaigns:
        campaigns.data?.filter((campaign) => campaign.status === "active")
          .length ?? 0,
      netFundsPaise,
      capturedGifts,
      volunteers: volunteers.data?.length ?? 0,
      approvedVolunteerHours: (hours.data ?? []).reduce(
        (total, entry) => total + entry.hours,
        0,
      ),
      statesReached: states.size,
    },
    donationsOverTime: sortedSeries(donationDates).map((entry) => ({
      date: entry.date,
      amount: entry.value,
    })),
    campaignsOverTime: sortedSeries(campaignDates).map((entry) => ({
      date: entry.date,
      count: entry.value,
    })),
    volunteersOverTime,
  };
}
