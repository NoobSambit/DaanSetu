export const campaignStatuses = [
  "draft",
  "pending_review",
  "changes_requested",
  "rejected",
  "approved",
  "active",
  "paused",
  "completed",
  "cancelled",
] as const;

export type CampaignStatus = (typeof campaignStatuses)[number];

const ownerTransitions: Record<CampaignStatus, readonly CampaignStatus[]> = {
  draft: ["pending_review", "cancelled"],
  pending_review: [],
  changes_requested: ["pending_review", "cancelled"],
  rejected: [],
  approved: [],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const adminTransitions: Record<CampaignStatus, readonly CampaignStatus[]> = {
  draft: [],
  pending_review: ["changes_requested", "rejected", "approved"],
  changes_requested: [],
  rejected: [],
  approved: ["active", "cancelled"],
  active: ["paused", "completed", "cancelled"],
  paused: ["active", "completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function canTransitionCampaign(
  current: CampaignStatus,
  next: CampaignStatus,
  actor: "owner" | "admin",
): boolean {
  const transitions = actor === "admin" ? adminTransitions : ownerTransitions;
  return transitions[current].includes(next);
}

export function canAcceptDonations(input: {
  status: CampaignStatus;
  payoutStatus: string | null;
  deadline: Date;
  now?: Date;
}): boolean {
  return (
    input.status === "active" &&
    input.payoutStatus === "active" &&
    input.deadline.getTime() > (input.now ?? new Date()).getTime()
  );
}
