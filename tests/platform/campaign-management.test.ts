import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("campaign owners can edit drafts and manage milestones through server actions", () => {
  const page = read("app/campaigns/[id]/manage/page.tsx");
  const actions = read("app/campaigns/[id]/manage/actions.ts");

  assert.match(page, /updateCampaignDraftFormAction/);
  assert.match(page, /createCampaignMilestoneFormAction/);
  assert.match(page, /deleteCampaignMilestoneFormAction/);
  assert.match(page, /name="evidence"/);
  assert.match(actions, /z\s*\.object/);
  assert.match(actions, /encryptSensitiveBytes/);
  assert.match(actions, /validatePrivateDocument/);
  assert.match(actions, /creator_id/);
  assert.doesNotMatch(actions, /getBrowserClient/);
});

test("campaign milestones use integer paise, owner RLS, and transactional achievement notifications", () => {
  const migration = read(
    "supabase/migrations/032_complete_campaign_management.sql",
  );

  assert.match(migration, /target_paise BIGINT/);
  assert.match(migration, /Campaign owners manage milestones/);
  assert.match(migration, /Public reads active campaign milestones/);
  assert.match(
    migration,
    /CREATE OR REPLACE FUNCTION public\.achieve_campaign_milestones/,
  );
  assert.match(migration, /campaign_milestone/);
  assert.match(migration, /notifications/);
});

test("campaign update management writes real update columns and enforces ownership", () => {
  const page = read("app/campaigns/[id]/updates/page.tsx");
  const actions = read("app/campaigns/actions.ts");

  assert.match(page, /createCampaignUpdateFormAction/);
  assert.match(page, /\.select\("id, text, image_url, created_at"\)/);
  assert.doesNotMatch(page, /\.select\("id, title, content/);
  assert.match(actions, /createCampaignUpdateFormAction/);
  assert.match(actions, /Only the campaign owner/);
});
