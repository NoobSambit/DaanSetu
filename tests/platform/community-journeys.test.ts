import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("verified users publish and interact through validated server actions", () => {
  const actions = read("app/community/actions.ts");
  const createPage = read("app/community/create/page.tsx");
  const detailPage = read("app/community/[id]/page.tsx");

  assert.match(actions, /publishPostFormAction/);
  assert.match(actions, /togglePostLikeFormAction/);
  assert.match(actions, /addPostCommentFormAction/);
  assert.match(actions, /bookmarkPostFormAction/);
  assert.match(actions, /reportPostFormAction/);
  assert.match(actions, /email_confirmed_at/);
  assert.match(createPage, /CommunityPostComposer/);
  assert.match(detailPage, /addPostCommentFormAction/);
  assert.doesNotMatch(createPage, /api\/posts\/create/);
});

test("community media uses the real Supabase bucket with owner cleanup", () => {
  const createPage = read("app/community/create/page.tsx");
  const composer = read("app/community/create/CommunityPostComposer.tsx");
  const uploadRoute = read("app/api/upload/image/route.ts");
  const migration = read(
    "supabase/migrations/037_community_media_and_action_limits.sql",
  );

  assert.match(createPage, /CommunityPostComposer/);
  assert.match(composer, /api\/upload\/image/);
  assert.match(composer, /publishPostAction/);
  assert.match(uploadRoute, /community-media/);
  assert.doesNotMatch(uploadRoute, /validBuckets|formData\.get\("bucket"\)/);
  assert.match(migration, /Users delete own community media/);
  assert.match(migration, /storage\.foldername\(name\)/);
});

test("community RLS and database triggers protect interactions and notifications", () => {
  const migration = read(
    "supabase/migrations/033_secure_community_and_moderation.sql",
  );

  assert.match(migration, /Verified users publish posts/);
  assert.match(migration, /Visible post interactions/);
  assert.match(migration, /notify_post_interaction/);
  assert.match(migration, /REVOKE INSERT ON public\.notifications/);
  assert.match(
    migration,
    /UNIQUE[\s\S]*reported_by[\s\S]*entity_type[\s\S]*entity_id/i,
  );
});

test("admin moderation resolves posts and reviews without deleting audit history", () => {
  const actions = read("app/admin/moderation/actions.ts");
  const page = read("app/admin/moderation/page.tsx");

  assert.match(actions, /moderateContentFormAction/);
  assert.match(actions, /moderate_reported_content/);
  assert.match(actions, /review_impact_story/);
  assert.match(page, /moderateContentFormAction/);
  assert.match(page, /entity_id/);
});
