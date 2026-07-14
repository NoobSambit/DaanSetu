import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

const clientMutationSurfaces = [
  "app/campaigns/create/page.tsx",
  "components/CampaignUpdates.tsx",
  "app/volunteer/profile/page.tsx",
  "app/corporate/profile/page.tsx",
  "app/corporate/campaigns/create/page.tsx",
  "app/corporate/employees/page.tsx",
];

test("client surfaces never import direct database mutation helpers", () => {
  for (const path of clientMutationSurfaces) {
    const contents = source(path);

    assert.doesNotMatch(
      contents,
      /\b(createCampaign|createCampaignUpdate|createVolunteerProfile|updateVolunteerProfile|createCorporateProfile|updateCorporateProfile|createCorporateCampaign|createEmployee|deleteEmployee)\b/,
      `${path} must use a validated server action for writes`,
    );
  }
});

test("browser-readable repositories expose no legacy database mutation helpers", () => {
  for (const path of [
    "lib/services/campaigns.ts",
    "lib/services/corporate-campaigns.ts",
    "lib/services/partnerships.ts",
    "lib/services/badges.ts",
    "lib/services/corporate-employees.ts",
    "lib/services/bookmarks.ts",
    "lib/services/notifications.ts",
    "lib/services/corporate.ts",
    "lib/services/volunteers.ts",
  ]) {
    const repository = source(path);
    assert.doesNotMatch(repository, /\.insert\(/, path);
    assert.doesNotMatch(repository, /\.update\(/, path);
    assert.doesNotMatch(repository, /\.delete\(/, path);
    assert.doesNotMatch(repository, /\.rpc\(/, path);
  }

  const profiles = source("lib/services/user-profiles.ts");
  assert.doesNotMatch(profiles, /\.(insert|update|delete|upsert)\(/);
  assert.match(profiles, /\.rpc\("get_user_stats"/);
});

test("supporter profile editing is an authenticated server-owned journey", () => {
  const action = source("app/dashboard/profile/edit/actions.ts");
  const page = source("app/dashboard/profile/edit/page.tsx");
  const publicProfile = source("app/profile/[userId]/page.tsx");

  assert.match(action, /^"use server"/);
  assert.match(action, /z\s*\.object/);
  assert.match(action, /email_confirmed_at/);
  assert.match(action, /save_user_public_profile/);
  assert.doesNotMatch(action, /\.(insert|update|delete|upsert)\(/);
  assert.match(page, /saveUserProfileAction/);
  assert.doesNotMatch(publicProfile, /\.select\("\*"\)/);
  assert.doesNotMatch(publicProfile, /\bemail\b/);
});

test("campaign writes use validated, ownership-scoped server actions", () => {
  const action = source("app/campaigns/actions.ts");

  assert.match(action, /^"use server"/);
  assert.match(action, /z\s*\.object/);
  assert.match(action, /email_confirmed_at/);
  assert.match(action, /user_id/);
  assert.match(action, /createCampaignAction/);
  assert.match(action, /createCampaignUpdateAction/);
  assert.doesNotMatch(action, /createAdminClient|service_role/i);
});

test("profile and CSR writes are validated on the server", () => {
  const volunteer = source("app/volunteer/profile/actions.ts");
  const corporate = source("app/corporate/actions.ts");

  assert.match(volunteer, /^"use server"/);
  assert.match(volunteer, /z\s*\.object/);
  assert.match(volunteer, /email_confirmed_at/);
  assert.match(volunteer, /upsert/);

  assert.match(corporate, /saveCorporateProfileAction/);
  assert.match(corporate, /createCorporateCampaignAction/);
  assert.match(corporate, /revokeCorporateInvitationAction/);
  assert.match(corporate, /z\s*\.object/);
});

test("supporter fundraisers require consent, private evidence, payout review, and admin activation", () => {
  const action = source("app/campaigns/actions.ts");
  const migration = source("supabase/migrations/029_supporter_fundraisers.sql");
  const reviewPage = source("app/admin/fundraisers/page.tsx");
  const evidenceRoute = source(
    "app/api/campaign-evidence/[campaignId]/[index]/route.ts",
  );

  assert.match(action, /createSupporterCampaignAction/);
  assert.match(action, /beneficiaryConsent/);
  assert.match(action, /validatePrivateDocument/);
  assert.match(action, /encryptSensitiveBytes/);
  assert.match(migration, /create_supporter_campaign/);
  assert.match(migration, /'paypal'/);
  assert.match(migration, /'pending'/);
  assert.match(migration, /Admins read campaign evidence/);
  assert.match(reviewPage, /Activate after payout approval/);
  assert.match(evidenceRoute, /profile\?\.role !== "admin"/);
  assert.match(evidenceRoute, /decryptSensitiveBytes/);
});
