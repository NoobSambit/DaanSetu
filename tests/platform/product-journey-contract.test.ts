import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function pathFor(path: string): URL {
  return new URL(`../../${path}`, import.meta.url);
}

function read(path: string): string {
  assert.equal(existsSync(pathFor(path)), true, `Missing ${path}`);
  return readFileSync(pathFor(path), "utf8");
}

test("campaign owners and admins have complete management destinations", () => {
  for (const path of [
    "app/campaigns/[id]/manage/page.tsx",
    "app/campaigns/[id]/manage/actions.ts",
    "app/campaigns/[id]/updates/page.tsx",
    "app/admin/fundraisers/page.tsx",
    "app/admin/fundraisers/actions.ts",
  ]) {
    assert.equal(existsSync(pathFor(path)), true, `Missing ${path}`);
  }
});

test("review eligibility, reporting, and moderation destinations exist", () => {
  const reviewActions = read("app/ngos/[id]/reviews/actions.ts");
  const moderation = read("app/admin/moderation/actions.ts");

  assert.match(reviewActions, /donation|volunteer/i);
  assert.match(reviewActions, /captured|approved/i);
  assert.match(moderation, /hidden_at|hiddenAt/);
  assert.match(moderation, /audit/i);
});

test("volunteer applications and hours expose complete role workflows", () => {
  const volunteerActions = read("app/volunteer/actions.ts");
  const ngoActions = read("app/ngo/dashboard/volunteers/actions.ts");

  assert.match(volunteerActions, /submitted|withdrawn/);
  assert.match(ngoActions, /shortlisted|accepted|rejected/);
  assert.match(ngoActions, /pending|approved|rejected/);
  assert.match(ngoActions, /certificate/i);
});

test("community has detail, reporting, sharing, media, and moderation", () => {
  const detail = read("app/community/[id]/page.tsx");
  const actions = read("app/community/actions.ts");

  assert.match(detail, /comment/i);
  assert.match(actions, /bookmark/i);
  assert.match(actions, /report/i);
  assert.match(actions, /share/i);
  assert.match(actions, /media/i);
});

test("CSR invitations, pledges, settlement, and analytics are implemented", () => {
  const actions = read("app/corporate/actions.ts");
  const settlement = read("app/api/csr/settlements/route.ts");
  const invitation = read("app/corporate/invitations/[token]/page.tsx");

  assert.match(actions, /invitation|invite/i);
  assert.match(actions, /match.*percent|cap/i);
  assert.match(settlement, /pledge/i);
  assert.match(settlement, /paypal/i);
  assert.match(invitation, /expir|revok|accept/i);
});

test("admin operations cover every privileged workflow", () => {
  const operations = read("app/admin/operations/page.tsx");

  for (const label of [
    "NGO verification",
    "Fundraiser",
    "Moderation",
    "Refund",
    "Payout",
    "CSR settlement",
    "Audit",
  ]) {
    assert.match(operations, new RegExp(label, "i"));
  }
});

test("no retained application page advertises unfinished functionality", () => {
  const dashboard = read("app/ngo/dashboard/page.tsx");
  assert.doesNotMatch(dashboard, /coming soon|not implemented/i);
});
