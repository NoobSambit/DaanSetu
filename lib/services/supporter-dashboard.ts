import "server-only";

import {
  buildSupporterProfileProgress,
  getDonationDestination,
  summarizeSupporterActivity,
} from "@/lib/domain/supporter-dashboard";
import { rankRecommendations } from "@/lib/domain/recommendations";
import { createAdminClient } from "@/lib/supabase/admin";

const DASHBOARD_FIXTURE = "supporter-dashboard-v1";

type DashboardNgoRelation = {
  id: string;
  name: string | null;
  display_name: string | null;
  category?: string | null;
};

type DashboardCampaignRelation = {
  id: string;
  title: string;
};

export type DashboardDonation = {
  id: string;
  amount_paise: number;
  refunded_paise: number;
  status: string;
  cause: string;
  ngo_id: string | null;
  campaign_id: string | null;
  created_at: string;
  captured_at: string | null;
  receipt_number: string | null;
  metadata: unknown;
  ngo: DashboardNgoRelation | null;
  campaign: DashboardCampaignRelation | null;
  destination: ReturnType<typeof getDonationDestination>;
};

export type DashboardNgo = {
  id: string;
  name: string;
  category: string;
  city: string | null;
  state: string | null;
  beneficiariesReached: number;
  volunteersEngaged: number;
  score: number;
  reason: string;
};

export type DashboardCampaign = {
  id: string;
  title: string;
  category: string;
  targetPaise: number;
  raisedPaise: number;
  deadline: string;
  imageUrl: string | null;
  organization: string;
};

export type DashboardOpportunity = {
  id: string;
  title: string;
  city: string;
  date: string;
  requiredSkills: string[];
  totalNeeded: number;
  organization: string;
};

export type DashboardUpdate = {
  id: string;
  ngoId: string;
  title: string;
  body: string;
  publishedAt: string | null;
  organization: string;
};

export type DashboardCommunityItem = {
  id: string;
  title: string;
  category: string;
  createdAt: string | null;
};

export type DashboardImpactJourneyItem = {
  id: string;
  kind: "contribution" | "volunteer" | "application" | "follow";
  date: string;
  title: string;
  detail: string;
  href: string;
};

export type SupporterDashboardData = {
  account: {
    name: string;
    firstName: string;
    email: string;
    location: string | null;
  };
  summary: ReturnType<typeof summarizeSupporterActivity>;
  profileProgress: ReturnType<typeof buildSupporterProfileProgress>;
  previewMode: boolean;
  unreadNotifications: number;
  streakDays: number;
  recentDonations: DashboardDonation[];
  recommendations: DashboardNgo[];
  followedOrganizations: DashboardNgo[];
  campaigns: DashboardCampaign[];
  opportunities: DashboardOpportunity[];
  volunteerApplications: Array<{
    id: string;
    status: string;
    appliedAt: string;
    opportunity: {
      id: string;
      title: string;
      date: string;
      city: string;
    } | null;
  }>;
  volunteerHours: Array<{
    id: string;
    hours: number;
    status: string;
    date: string;
    description: string | null;
  }>;
  impactJourney: DashboardImpactJourneyItem[];
  updates: DashboardUpdate[];
  community: DashboardCommunityItem[];
  dataWarnings: string[];
};

type QueryResult = {
  error: { message: string } | null;
};

function warning(warnings: string[], label: string, result: QueryResult): void {
  if (result.error) warnings.push(`${label}: ${result.error.message}`);
}

function firstName(name: string, email: string): string {
  const candidate = name.trim().split(/\s+/)[0];
  if (candidate) return candidate;
  return email.split("@")[0] || "Supporter";
}

function fixtureMetadata(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "dashboard_fixture" in value &&
    value.dashboard_fixture === DASHBOARD_FIXTURE
  );
}

const causeCategory: Record<string, string> = {
  education: "education",
  hunger: "food",
  healthcare: "health",
  disaster: "disaster-relief",
  general: "other",
};

function recommendationReason({
  categoryMatch,
  followed,
  cityMatch,
}: {
  categoryMatch: boolean;
  followed: boolean;
  cityMatch: boolean;
}) {
  if (followed) return "An organization you follow";
  if (categoryMatch) return "Matches causes you have supported";
  if (cityMatch) return "Creating impact near your location";
  return "A published organization selected for you";
}

function dateKey(value: string | null | undefined): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? null
    : parsed.toISOString().slice(0, 10);
}

function formatPaise(value: number): string {
  return `₹${(value / 100).toLocaleString("en-IN")}`;
}

export async function getSupporterDashboard({
  userId,
  email,
}: {
  userId: string;
  email: string;
}): Promise<SupporterDashboardData> {
  const reader = createAdminClient();
  const donationSelection =
    "id, amount_paise, refunded_paise, status, cause, ngo_id, campaign_id, created_at, captured_at, receipt_number, metadata, ngo:ngos(id, name, display_name, category), campaign:campaigns(id, title)";

  const [
    accountResult,
    profileResult,
    realDonationsResult,
    volunteerHoursResult,
    volunteerApplicationsResult,
    followsResult,
    notificationsResult,
    ngosResult,
    campaignsResult,
    opportunitiesResult,
    updatesResult,
    communityResult,
  ] = await Promise.all([
    reader.from("users").select("name").eq("id", userId).maybeSingle(),
    reader
      .from("user_profiles")
      .select("bio, avatar_url, location")
      .eq("user_id", userId)
      .maybeSingle(),
    reader
      .from("donations")
      .select(donationSelection)
      .eq("user_id", userId)
      .eq("is_demo", false)
      .eq("is_csr_match", false)
      .in("status", ["captured", "partially_refunded", "refunded"])
      .order("created_at", { ascending: false }),
    reader
      .from("volunteer_hours")
      .select("id, hours, status, date, description")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    reader
      .from("volunteer_applications")
      .select(
        "id, status, applied_at, opportunity:volunteer_opportunities(id, title, date, city)",
      )
      .eq("user_id", userId)
      .order("applied_at", { ascending: false }),
    reader
      .from("follows")
      .select("following_id, created_at")
      .eq("follower_id", userId)
      .eq("following_type", "ngo"),
    reader
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
    reader
      .from("ngos")
      .select(
        "id, name, display_name, category, city, state, beneficiaries_reached, volunteers_engaged",
      )
      .eq("profile_status", "published")
      .eq("is_discoverable", true)
      .order("beneficiaries_reached", { ascending: false })
      .limit(24),
    reader
      .from("campaigns")
      .select(
        "id, title, category, target_paise, raised_paise, deadline, image_url, ngos(id, name, display_name)",
      )
      .eq("status", "active")
      .order("deadline", { ascending: true })
      .limit(4),
    reader
      .from("volunteer_opportunities")
      .select(
        "id, title, city, date, required_skills, total_needed, ngos(id, name, display_name)",
      )
      .eq("status", "active")
      .order("date", { ascending: true })
      .limit(4),
    reader
      .from("ngo_updates")
      .select(
        "id, ngo_id, title, body, published_at, ngos(id, name, display_name)",
      )
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(4),
    reader
      .from("posts")
      .select("id, title, category, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(4),
  ]);

  const dataWarnings: string[] = [];
  warning(dataWarnings, "Account", accountResult);
  warning(dataWarnings, "Profile", profileResult);
  warning(dataWarnings, "Giving", realDonationsResult);
  warning(dataWarnings, "Volunteer hours", volunteerHoursResult);
  warning(dataWarnings, "Volunteer applications", volunteerApplicationsResult);
  warning(dataWarnings, "Following", followsResult);
  warning(dataWarnings, "Notifications", notificationsResult);
  warning(dataWarnings, "Organizations", ngosResult);
  warning(dataWarnings, "Campaigns", campaignsResult);
  warning(dataWarnings, "Opportunities", opportunitiesResult);
  warning(dataWarnings, "Updates", updatesResult);
  warning(dataWarnings, "Community", communityResult);

  const realDonations = (realDonationsResult.data ?? []) as unknown[];
  let selectedDonations = realDonations;
  let previewMode = false;

  if (realDonations.length === 0 && !realDonationsResult.error) {
    const previewResult = await reader
      .from("donations")
      .select(donationSelection)
      .eq("user_id", userId)
      .eq("is_demo", true)
      .eq("is_csr_match", false)
      .contains("metadata", { dashboard_fixture: DASHBOARD_FIXTURE })
      .in("status", ["captured", "partially_refunded", "refunded"])
      .order("created_at", { ascending: false });

    warning(dataWarnings, "Preview giving", previewResult);
    const previewDonations = (previewResult.data ?? []) as unknown[];
    if (previewDonations.length > 0) {
      selectedDonations = previewDonations;
      previewMode = true;
    }
  }

  const donations = (
    selectedDonations as Array<Omit<DashboardDonation, "destination">>
  ).filter((donation) => !previewMode || fixtureMetadata(donation.metadata));
  const volunteerHours = (volunteerHoursResult.data ?? []).map((entry) => ({
    id: entry.id,
    hours: Number(entry.hours),
    status: entry.status,
    date: entry.date,
    description: entry.description,
  }));
  const summary = summarizeSupporterActivity({
    donations,
    volunteerHours,
  });
  const followRows = followsResult.data ?? [];
  const followedIds = new Set(followRows.map((follow) => follow.following_id));
  const profile = profileResult.data;
  const locationParts = (profile?.location as string | null | undefined)
    ?.split(",")
    .map((part: string) => part.trim())
    .filter(Boolean);
  const profileCity = locationParts?.[0] ?? null;
  const profileState = locationParts?.[1] ?? null;
  const supportedCategories = [
    ...new Set(
      donations
        .map((donation) => causeCategory[donation.cause])
        .filter(Boolean),
    ),
  ];
  const donatedNgoIds = new Set(
    donations
      .map((donation) => donation.ngo_id)
      .filter((id): id is string => Boolean(id)),
  );
  const ngoCandidates = (
    (ngosResult.data ?? []) as Array<{
      id: string;
      name: string | null;
      display_name: string | null;
      category: string | null;
      city: string | null;
      state: string | null;
      beneficiaries_reached: number | null;
      volunteers_engaged: number | null;
    }>
  )
    .filter((ngo) => Boolean(ngo.name || ngo.display_name))
    .map((ngo) => ({
      ...ngo,
      followed: followedIds.has(ngo.id),
      priorDonation: donatedNgoIds.has(ngo.id),
    }));
  const rankedNgos = rankRecommendations(ngoCandidates, {
    categories: supportedCategories,
    skills: [],
    city: profileCity,
    state: profileState,
  });
  const recommendations: DashboardNgo[] = rankedNgos.slice(0, 4).map((ngo) => {
    const categoryMatch = Boolean(
      ngo.category && supportedCategories.includes(ngo.category),
    );
    const cityMatch = Boolean(
      ngo.city &&
      profileCity &&
      ngo.city.toLocaleLowerCase() === profileCity.toLocaleLowerCase(),
    );
    return {
      id: ngo.id,
      name: ngo.display_name ?? ngo.name ?? "DaanSetu organization",
      category: ngo.category ?? "community",
      city: ngo.city,
      state: ngo.state,
      beneficiariesReached: ngo.beneficiaries_reached ?? 0,
      volunteersEngaged: ngo.volunteers_engaged ?? 0,
      score: ngo.score,
      reason: recommendationReason({
        categoryMatch,
        followed: ngo.followed,
        cityMatch,
      }),
    };
  });
  const allDashboardNgos = new Map(
    rankedNgos.map((ngo) => [
      ngo.id,
      recommendations.find((item) => item.id === ngo.id) ?? {
        id: ngo.id,
        name: ngo.display_name ?? ngo.name ?? "DaanSetu organization",
        category: ngo.category ?? "community",
        city: ngo.city,
        state: ngo.state,
        beneficiariesReached: ngo.beneficiaries_reached ?? 0,
        volunteersEngaged: ngo.volunteers_engaged ?? 0,
        score: ngo.score,
        reason: "An organization you follow",
      },
    ]),
  );
  const followedOrganizations = [...followedIds]
    .map((id) => allDashboardNgos.get(id))
    .filter((ngo): ngo is DashboardNgo => Boolean(ngo))
    .slice(0, 3);

  const mappedDonations: DashboardDonation[] = donations.map((donation) => {
    const ngoName = donation.ngo?.display_name ?? donation.ngo?.name ?? null;
    return {
      ...donation,
      destination: getDonationDestination({
        ngo:
          donation.ngo && ngoName
            ? { id: donation.ngo.id, name: ngoName }
            : null,
        campaign: donation.campaign,
      }),
    };
  });
  const mappedCampaigns: DashboardCampaign[] = (
    (campaignsResult.data ?? []) as unknown as Array<{
      id: string;
      title: string;
      category: string;
      target_paise: number;
      raised_paise: number;
      deadline: string;
      image_url: string | null;
      ngos: DashboardNgoRelation | null;
    }>
  ).map((campaign) => ({
    id: campaign.id,
    title: campaign.title,
    category: campaign.category,
    targetPaise: campaign.target_paise,
    raisedPaise: campaign.raised_paise,
    deadline: campaign.deadline,
    imageUrl: campaign.image_url,
    organization:
      campaign.ngos?.display_name ??
      campaign.ngos?.name ??
      "Community fundraiser",
  }));
  const mappedOpportunities: DashboardOpportunity[] = (
    (opportunitiesResult.data ?? []) as unknown as Array<{
      id: string;
      title: string;
      city: string;
      date: string;
      required_skills: string[];
      total_needed: number;
      ngos: DashboardNgoRelation | null;
    }>
  ).map((opportunity) => ({
    id: opportunity.id,
    title: opportunity.title,
    city: opportunity.city,
    date: opportunity.date,
    requiredSkills: opportunity.required_skills,
    totalNeeded: opportunity.total_needed,
    organization:
      opportunity.ngos?.display_name ??
      opportunity.ngos?.name ??
      "DaanSetu organization",
  }));
  const mappedUpdates: DashboardUpdate[] = (
    (updatesResult.data ?? []) as unknown as Array<{
      id: string;
      ngo_id: string;
      title: string;
      body: string;
      published_at: string | null;
      ngos: DashboardNgoRelation | null;
    }>
  ).map((update) => ({
    id: update.id,
    ngoId: update.ngo_id,
    title: update.title,
    body: update.body,
    publishedAt: update.published_at,
    organization:
      update.ngos?.display_name ?? update.ngos?.name ?? "DaanSetu organization",
  }));
  const mappedApplications = (
    (volunteerApplicationsResult.data ?? []) as unknown as Array<{
      id: string;
      status: string;
      applied_at: string;
      opportunity: {
        id: string;
        title: string;
        date: string;
        city: string;
      } | null;
    }>
  ).map((application) => ({
    id: application.id,
    status: application.status,
    appliedAt: application.applied_at,
    opportunity: application.opportunity,
  }));
  const impactJourney: DashboardImpactJourneyItem[] = [
    mappedDonations[0]
      ? {
          id: `contribution-${mappedDonations[0].id}`,
          kind: "contribution" as const,
          date: mappedDonations[0].captured_at ?? mappedDonations[0].created_at,
          title: `Supported ${mappedDonations[0].destination.label}`,
          detail: `${
            mappedDonations[0].destination.organization ??
            "Community contribution"
          } · ${formatPaise(
            mappedDonations[0].amount_paise - mappedDonations[0].refunded_paise,
          )} contributed`,
          href: mappedDonations[0].destination.href,
        }
      : null,
    volunteerHours.find((entry) => entry.status === "approved")
      ? (() => {
          const entry = volunteerHours.find(
            (candidate) => candidate.status === "approved",
          )!;
          return {
            id: `volunteer-${entry.id}`,
            kind: "volunteer" as const,
            date: entry.date,
            title: `Volunteered ${entry.hours} hours`,
            detail: entry.description ?? "Approved community service",
            href: "/volunteer/dashboard",
          };
        })()
      : null,
    mappedApplications[0]
      ? {
          id: `application-${mappedApplications[0].id}`,
          kind: "application" as const,
          date: mappedApplications[0].appliedAt,
          title: mappedApplications[0].opportunity
            ? `Applied for ${mappedApplications[0].opportunity.title}`
            : "Submitted a volunteer application",
          detail: `${mappedApplications[0].status.replaceAll("_", " ")} · Volunteer opportunity`,
          href: "/volunteer/dashboard",
        }
      : null,
    followRows[0] && allDashboardNgos.get(followRows[0].following_id)
      ? {
          id: `follow-${followRows[0].following_id}`,
          kind: "follow" as const,
          date: followRows[0].created_at,
          title: `Followed ${allDashboardNgos.get(followRows[0].following_id)!.name}`,
          detail: "Added to your organization watchlist",
          href: `/ngos/${followRows[0].following_id}`,
        }
      : null,
  ]
    .filter((item): item is DashboardImpactJourneyItem => Boolean(item))
    .sort(
      (left, right) =>
        new Date(right.date).getTime() - new Date(left.date).getTime(),
    );
  const activeDates = new Set(
    [
      ...mappedDonations.map((donation) =>
        dateKey(donation.captured_at ?? donation.created_at),
      ),
      ...volunteerHours.map((entry) => dateKey(entry.date)),
      ...mappedApplications.map((application) =>
        dateKey(application.appliedAt),
      ),
    ].filter((date): date is string => Boolean(date)),
  );
  const accountName = accountResult.data?.name?.trim() || email.split("@")[0];
  const profileProgress = buildSupporterProfileProgress({
    causesSupported: summary.causesSupported,
    organizationsFollowed: followedIds.size,
    campaignsJoined: summary.campaignsJoined,
    hasCompletedProfile: Boolean(
      profile?.bio && profile?.location && profile?.avatar_url,
    ),
  });

  return {
    account: {
      name: accountName,
      firstName: firstName(accountName, email),
      email,
      location: profile?.location ?? null,
    },
    summary,
    profileProgress,
    previewMode,
    unreadNotifications: notificationsResult.count ?? 0,
    streakDays: previewMode ? 12 : Math.min(30, activeDates.size),
    recentDonations: mappedDonations.slice(0, 5),
    recommendations,
    followedOrganizations,
    campaigns: mappedCampaigns,
    opportunities: mappedOpportunities,
    volunteerApplications: mappedApplications,
    volunteerHours,
    impactJourney,
    updates: mappedUpdates,
    community: (communityResult.data ?? []).map((post) => ({
      id: post.id,
      title: post.title,
      category: post.category,
      createdAt: post.created_at,
    })),
    dataWarnings,
  };
}

export { DASHBOARD_FIXTURE };
