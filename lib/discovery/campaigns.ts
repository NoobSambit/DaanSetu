import "server-only";

import type { CampaignDiscoveryFilters } from "@/lib/discovery/filters";
import { createAdminClient } from "@/lib/supabase/admin";

export type PublicCampaign = {
  id: string;
  title: string;
  shortDescription: string;
  category: "education" | "food" | "health" | "women" | "animals" | "disaster";
  targetPaise: number;
  raisedPaise: number;
  deadline: string;
  imageUrl: string | null;
  ngoName: string;
  ngoId: string | null;
};

type CampaignRecord = {
  id: string;
  title: string;
  short_description: string;
  description: string;
  category: PublicCampaign["category"];
  target_paise: number;
  raised_paise: number;
  deadline: string;
  image_url: string | null;
  ngo_id: string | null;
  created_at: string;
};

export type CampaignDiscoveryResult = {
  campaigns: PublicCampaign[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error: boolean;
};

export async function discoverCampaigns(
  filters: CampaignDiscoveryFilters,
): Promise<CampaignDiscoveryResult> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("campaigns")
    .select(
      "id, title, short_description, description, category, target_paise, raised_paise, deadline, image_url, ngo_id, created_at",
    )
    .eq("status", "active")
    .not("published_at", "is", null);

  if (error) {
    console.error("Campaign discovery query failed");
    return {
      campaigns: [],
      total: 0,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages: 0,
      error: true,
    };
  }

  let campaigns = (data ?? []) as CampaignRecord[];
  if (filters.search) {
    const search = filters.search.toLocaleLowerCase("en-IN");
    campaigns = campaigns.filter((campaign) =>
      [campaign.title, campaign.short_description, campaign.description].some(
        (value) => value.toLocaleLowerCase("en-IN").includes(search),
      ),
    );
  }
  if (filters.category) {
    campaigns = campaigns.filter(
      (campaign) => campaign.category === filters.category,
    );
  }

  campaigns.sort((left, right) => {
    if (filters.sort === "ending-soon") {
      return Date.parse(left.deadline) - Date.parse(right.deadline);
    }
    if (filters.sort === "most-funded") {
      return right.raised_paise - left.raised_paise;
    }
    if (filters.sort === "progress") {
      const leftProgress = left.raised_paise / left.target_paise;
      const rightProgress = right.raised_paise / right.target_paise;
      return rightProgress - leftProgress;
    }
    return Date.parse(right.created_at) - Date.parse(left.created_at);
  });

  const ngoIds = [
    ...new Set(campaigns.map((campaign) => campaign.ngo_id).filter(Boolean)),
  ] as string[];
  const { data: ngos } = ngoIds.length
    ? await admin.from("ngos").select("id, name, display_name").in("id", ngoIds)
    : { data: [] };
  const ngoNames = new Map(
    (ngos ?? []).map(
      (ngo: {
        id: string;
        name: string | null;
        display_name: string | null;
      }) => [ngo.id, ngo.display_name ?? ngo.name ?? "Community fundraiser"],
    ),
  );

  const total = campaigns.length;
  const totalPages = Math.ceil(total / filters.pageSize);
  const page = totalPages === 0 ? 1 : Math.min(filters.page, totalPages);
  const offset = (page - 1) * filters.pageSize;
  const pageRecords = campaigns
    .slice(offset, offset + filters.pageSize)
    .map((campaign) => ({
      id: campaign.id,
      title: campaign.title,
      shortDescription: campaign.short_description,
      category: campaign.category,
      targetPaise: campaign.target_paise,
      raisedPaise: campaign.raised_paise,
      deadline: campaign.deadline,
      imageUrl: campaign.image_url,
      ngoName: campaign.ngo_id
        ? (ngoNames.get(campaign.ngo_id) ?? "Verified beneficiary")
        : "Community fundraiser",
      ngoId: campaign.ngo_id,
    }));

  return {
    campaigns: pageRecords,
    total,
    page,
    pageSize: filters.pageSize,
    totalPages,
    error: false,
  };
}
