import assert from "node:assert/strict";
import test from "node:test";

import {
  canAcceptDonations,
  canTransitionCampaign,
} from "../../lib/domain/campaigns.ts";

test("campaign owners can submit drafts but cannot approve them", () => {
  assert.equal(canTransitionCampaign("draft", "pending_review", "owner"), true);
  assert.equal(
    canTransitionCampaign("pending_review", "approved", "owner"),
    false,
  );
});

test("admins can review submitted campaigns but cannot skip review", () => {
  assert.equal(
    canTransitionCampaign("pending_review", "changes_requested", "admin"),
    true,
  );
  assert.equal(
    canTransitionCampaign("pending_review", "approved", "admin"),
    true,
  );
  assert.equal(canTransitionCampaign("draft", "active", "admin"), false);
});

test("paused campaigns can resume through valid transitions", () => {
  assert.equal(canTransitionCampaign("active", "paused", "owner"), true);
  assert.equal(canTransitionCampaign("paused", "active", "owner"), true);
});

test("donations require an active campaign, payout, and future deadline", () => {
  const future = new Date("2030-01-02T00:00:00.000Z");
  const now = new Date("2030-01-01T00:00:00.000Z");

  assert.equal(
    canAcceptDonations({
      status: "active",
      payoutStatus: "active",
      deadline: future,
      now,
    }),
    true,
  );
  assert.equal(
    canAcceptDonations({
      status: "active",
      payoutStatus: "pending",
      deadline: future,
      now,
    }),
    false,
  );
  assert.equal(
    canAcceptDonations({
      status: "paused",
      payoutStatus: "active",
      deadline: future,
      now,
    }),
    false,
  );
  assert.equal(
    canAcceptDonations({
      status: "active",
      payoutStatus: "active",
      deadline: now,
      now,
    }),
    false,
  );
});
