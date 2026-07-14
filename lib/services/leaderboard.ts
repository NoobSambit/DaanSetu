import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export interface DonorLeaderboardEntry {
  user_id: string;
  user_name: string;
  total_donated: number;
  donation_count: number;
  rank: number;
}

export interface VolunteerLeaderboardEntry {
  user_id: string;
  user_name: string;
  approved_hours: number;
  rank: number;
}

export interface NGOLeaderboardEntry {
  ngo_id: string;
  ngo_name: string;
  ngo_category: string;
  total_received: number;
  donor_count: number;
  rank: number;
}

export interface CorporateLeaderboardEntry {
  corporate_id: string;
  company_name: string;
  industry: string;
  total_contributed: number;
  campaign_count: number;
  rank: number;
}

type NetDonation = {
  amount_paise: number;
  refunded_paise: number;
};

function netRupees(donation: NetDonation): number {
  return Math.max(0, donation.amount_paise - donation.refunded_paise) / 100;
}

export async function getTopDonors(
  limit = 10,
): Promise<DonorLeaderboardEntry[]> {
  const { data, error } = await createAdminClient()
    .from("donations")
    .select(
      "user_id, amount_paise, refunded_paise, users!donations_user_id_fkey(name)",
    )
    .eq("is_demo", false)
    .eq("is_anonymous", false)
    .eq("is_csr_match", false)
    .in("status", ["captured", "partially_refunded", "refunded"]);

  if (error) throw new Error("Donor leaderboard could not be loaded");
  const entries = new Map<string, Omit<DonorLeaderboardEntry, "rank">>();

  for (const donation of data ?? []) {
    const amount = netRupees(donation);
    if (amount === 0) continue;
    const profile = Array.isArray(donation.users)
      ? donation.users[0]
      : donation.users;
    const entry = entries.get(donation.user_id) ?? {
      user_id: donation.user_id,
      user_name: profile?.name || "DaanSetu supporter",
      total_donated: 0,
      donation_count: 0,
    };
    entry.total_donated += amount;
    entry.donation_count += 1;
    entries.set(donation.user_id, entry);
  }

  return [...entries.values()]
    .sort((left, right) => right.total_donated - left.total_donated)
    .slice(0, Math.max(1, Math.min(limit, 100)))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function getTopVolunteers(
  limit = 10,
): Promise<VolunteerLeaderboardEntry[]> {
  const { data, error } = await createAdminClient()
    .from("volunteer_hours")
    .select("user_id, hours, users!volunteer_hours_user_id_fkey(name)")
    .eq("status", "approved");

  if (error) throw new Error("Volunteer leaderboard could not be loaded");
  const entries = new Map<string, Omit<VolunteerLeaderboardEntry, "rank">>();

  for (const record of data ?? []) {
    const profile = Array.isArray(record.users)
      ? record.users[0]
      : record.users;
    const entry = entries.get(record.user_id) ?? {
      user_id: record.user_id,
      user_name: profile?.name || "DaanSetu volunteer",
      approved_hours: 0,
    };
    entry.approved_hours += record.hours;
    entries.set(record.user_id, entry);
  }

  return [...entries.values()]
    .sort((left, right) => right.approved_hours - left.approved_hours)
    .slice(0, Math.max(1, Math.min(limit, 100)))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function getTopNGOs(limit = 10): Promise<NGOLeaderboardEntry[]> {
  const { data, error } = await createAdminClient()
    .from("donations")
    .select(
      "ngo_id, user_id, amount_paise, refunded_paise, ngos!donations_ngo_id_fkey(name, category, profile_status, is_discoverable)",
    )
    .eq("is_demo", false)
    .in("status", ["captured", "partially_refunded", "refunded"]);

  if (error) throw new Error("NGO leaderboard could not be loaded");
  const entries = new Map<
    string,
    Omit<NGOLeaderboardEntry, "rank" | "donor_count"> & {
      donors: Set<string>;
    }
  >();

  for (const donation of data ?? []) {
    const ngo = Array.isArray(donation.ngos) ? donation.ngos[0] : donation.ngos;
    const amount = netRupees(donation);
    if (
      amount === 0 ||
      ngo?.profile_status !== "published" ||
      !ngo.is_discoverable
    ) {
      continue;
    }
    const entry = entries.get(donation.ngo_id) ?? {
      ngo_id: donation.ngo_id,
      ngo_name: ngo.name || "Published NGO",
      ngo_category: ngo.category || "general",
      total_received: 0,
      donors: new Set<string>(),
    };
    entry.total_received += amount;
    entry.donors.add(donation.user_id);
    entries.set(donation.ngo_id, entry);
  }

  return [...entries.values()]
    .map(({ donors, ...entry }) => ({ ...entry, donor_count: donors.size }))
    .sort((left, right) => right.total_received - left.total_received)
    .slice(0, Math.max(1, Math.min(limit, 100)))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function getTopCorporates(
  limit = 10,
): Promise<CorporateLeaderboardEntry[]> {
  const { data, error } = await createAdminClient()
    .from("donations")
    .select(
      "corporate_id, csr_initiative_id, amount_paise, refunded_paise, corporate_profiles!donations_corporate_id_fkey(company_name, industry)",
    )
    .eq("is_demo", false)
    .eq("is_csr_match", true)
    .in("status", ["captured", "partially_refunded", "refunded"])
    .not("corporate_id", "is", null);

  if (error) throw new Error("Corporate leaderboard could not be loaded");
  const entries = new Map<
    string,
    Omit<CorporateLeaderboardEntry, "rank" | "campaign_count"> & {
      initiatives: Set<string>;
    }
  >();

  for (const donation of data ?? []) {
    if (!donation.corporate_id) continue;
    const amount = netRupees(donation);
    if (amount === 0) continue;
    const profile = Array.isArray(donation.corporate_profiles)
      ? donation.corporate_profiles[0]
      : donation.corporate_profiles;
    const entry = entries.get(donation.corporate_id) ?? {
      corporate_id: donation.corporate_id,
      company_name: profile?.company_name || "Corporate partner",
      industry: profile?.industry || "Not specified",
      total_contributed: 0,
      initiatives: new Set<string>(),
    };
    entry.total_contributed += amount;
    if (donation.csr_initiative_id) {
      entry.initiatives.add(donation.csr_initiative_id);
    }
    entries.set(donation.corporate_id, entry);
  }

  return [...entries.values()]
    .map(({ initiatives, ...entry }) => ({
      ...entry,
      campaign_count: initiatives.size,
    }))
    .sort((left, right) => right.total_contributed - left.total_contributed)
    .slice(0, Math.max(1, Math.min(limit, 100)))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
