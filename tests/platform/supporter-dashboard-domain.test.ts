import assert from "node:assert/strict";
import test from "node:test";

import {
  buildSupporterProfileProgress,
  getDonationDestination,
  summarizeSupporterActivity,
} from "../../lib/domain/supporter-dashboard.ts";

test("supporter summaries use net completed giving and approved service", () => {
  const summary = summarizeSupporterActivity({
    donations: [
      {
        amount_paise: 800_000,
        refunded_paise: 0,
        status: "captured",
        cause: "education",
        ngo_id: "ngo-1",
        campaign_id: "campaign-1",
      },
      {
        amount_paise: 500_000,
        refunded_paise: 46_000,
        status: "partially_refunded",
        cause: "healthcare",
        ngo_id: "ngo-2",
        campaign_id: "campaign-2",
      },
      {
        amount_paise: 75_000,
        refunded_paise: 75_000,
        status: "refunded",
        cause: "education",
        ngo_id: "ngo-1",
        campaign_id: "campaign-1",
      },
      {
        amount_paise: 900_000,
        refunded_paise: 0,
        status: "pending",
        cause: "disaster",
        ngo_id: "ngo-3",
        campaign_id: "campaign-3",
      },
    ],
    volunteerHours: [
      { hours: 20, status: "approved" },
      { hours: 28, status: "approved" },
      { hours: 7, status: "submitted" },
    ],
  });

  assert.deepEqual(summary, {
    totalContributedPaise: 1_254_000,
    contributionCount: 2,
    volunteerHours: 48,
    organizationsSupported: 2,
    campaignsJoined: 2,
    causesSupported: 2,
  });
});

test("profile progress reflects four concrete supporter onboarding steps", () => {
  const progress = buildSupporterProfileProgress({
    causesSupported: 2,
    organizationsFollowed: 3,
    campaignsJoined: 1,
    hasCompletedProfile: false,
  });

  assert.equal(progress.completedSteps, 3);
  assert.equal(progress.percentage, 75);
  assert.deepEqual(
    progress.steps.map((step) => [step.label, step.completed]),
    [
      ["Choose causes", true],
      ["Follow organizations", true],
      ["Join first campaign", true],
      ["Complete profile", false],
    ],
  );
});

test("donation destinations support NGO, campaign-only, and generic giving", () => {
  assert.deepEqual(
    getDonationDestination({
      ngo: { id: "ngo-1", name: "Udaan Learning" },
      campaign: { id: "campaign-1", title: "Rural Education Initiative" },
    }),
    {
      href: "/campaigns/campaign-1",
      label: "Rural Education Initiative",
      organization: "Udaan Learning",
    },
  );

  assert.deepEqual(
    getDonationDestination({
      ngo: null,
      campaign: { id: "campaign-2", title: "Community Relief Fund" },
    }),
    {
      href: "/campaigns/campaign-2",
      label: "Community Relief Fund",
      organization: null,
    },
  );

  assert.deepEqual(
    getDonationDestination({
      ngo: { id: "ngo-2", name: "Green Roots" },
      campaign: null,
    }),
    {
      href: "/ngos/ngo-2",
      label: "Green Roots",
      organization: null,
    },
  );

  assert.deepEqual(getDonationDestination({ ngo: null, campaign: null }), {
    href: "/dashboard/giving",
    label: "DaanSetu contribution",
    organization: null,
  });
});
