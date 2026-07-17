export type SupporterDonationSummaryInput = {
  amount_paise: number;
  refunded_paise: number;
  status: string;
  cause: string;
  ngo_id: string | null;
  campaign_id: string | null;
};

export type SupporterVolunteerHoursInput = {
  hours: number;
  status: string;
};

export type SupporterActivitySummary = {
  totalContributedPaise: number;
  contributionCount: number;
  volunteerHours: number;
  organizationsSupported: number;
  campaignsJoined: number;
  causesSupported: number;
};

const completedDonationStatuses = new Set([
  "captured",
  "partially_refunded",
  "refunded",
]);

export function summarizeSupporterActivity({
  donations,
  volunteerHours,
}: {
  donations: readonly SupporterDonationSummaryInput[];
  volunteerHours: readonly SupporterVolunteerHoursInput[];
}): SupporterActivitySummary {
  const completedDonations = donations
    .filter((donation) => completedDonationStatuses.has(donation.status))
    .map((donation) => ({
      ...donation,
      netPaise: Math.max(0, donation.amount_paise - donation.refunded_paise),
    }))
    .filter((donation) => donation.netPaise > 0);

  return {
    totalContributedPaise: completedDonations.reduce(
      (total, donation) => total + donation.netPaise,
      0,
    ),
    contributionCount: completedDonations.length,
    volunteerHours: volunteerHours
      .filter((entry) => entry.status === "approved")
      .reduce((total, entry) => total + Number(entry.hours), 0),
    organizationsSupported: new Set(
      completedDonations
        .map((donation) => donation.ngo_id)
        .filter((id): id is string => Boolean(id)),
    ).size,
    campaignsJoined: new Set(
      completedDonations
        .map((donation) => donation.campaign_id)
        .filter((id): id is string => Boolean(id)),
    ).size,
    causesSupported: new Set(
      completedDonations.map((donation) => donation.cause),
    ).size,
  };
}

export type SupporterProfileStep = {
  label: string;
  completed: boolean;
};

export function buildSupporterProfileProgress({
  causesSupported,
  organizationsFollowed,
  campaignsJoined,
  hasCompletedProfile,
}: {
  causesSupported: number;
  organizationsFollowed: number;
  campaignsJoined: number;
  hasCompletedProfile: boolean;
}) {
  const steps: SupporterProfileStep[] = [
    { label: "Choose causes", completed: causesSupported > 0 },
    {
      label: "Follow organizations",
      completed: organizationsFollowed > 0,
    },
    { label: "Join first campaign", completed: campaignsJoined > 0 },
    { label: "Complete profile", completed: hasCompletedProfile },
  ];
  const completedSteps = steps.filter((step) => step.completed).length;

  return {
    steps,
    completedSteps,
    percentage: completedSteps * 25,
  };
}

export type DonationDestinationInput = {
  ngo: { id: string; name: string } | null;
  campaign: { id: string; title: string } | null;
};

export function getDonationDestination({
  ngo,
  campaign,
}: DonationDestinationInput) {
  if (campaign) {
    return {
      href: `/campaigns/${campaign.id}`,
      label: campaign.title,
      organization: ngo?.name ?? null,
    };
  }

  if (ngo) {
    return {
      href: `/ngos/${ngo.id}`,
      label: ngo.name,
      organization: null,
    };
  }

  return {
    href: "/dashboard/giving",
    label: "DaanSetu contribution",
    organization: null,
  };
}
