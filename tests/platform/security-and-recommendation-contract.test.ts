import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function read(path: string): string {
  const url = new URL(`../../${path}`, import.meta.url);
  assert.equal(existsSync(url), true, `Missing ${path}`);
  return readFileSync(url, "utf8");
}

test("admin bootstrap is explicit and cannot self-promote through signup", () => {
  const authMigration = read("supabase/migrations/014_auth_pipeline.sql");
  const bootstrap = read("scripts/admin-bootstrap.ts");

  assert.doesNotMatch(authMigration, /raw_user_meta_data[\s\S]{0,300}admin/i);
  assert.match(bootstrap, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.match(bootstrap, /ADMIN_EMAIL/);
});

test("privileged clients are isolated to server-only modules", () => {
  const adminClient = read("lib/supabase/admin.ts");

  assert.match(adminClient, /server-only/);
  assert.match(adminClient, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(adminClient, /NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY/);
});

test("abuse-prone protocol routes enforce origin checks and rate limits", () => {
  for (const path of [
    "app/api/payment/create-order/route.ts",
    "app/api/payment/subscriptions/route.ts",
    "app/api/upload/image/route.ts",
    "app/api/ai/chat/route.ts",
  ]) {
    const route = read(path);
    assert.match(route, /origin|sameOrigin|verifyOrigin/i, path);
    assert.match(route, /rateLimit|rate-limit|limiter/i, path);
  }
});

test("abuse-prone server actions use a shared PostgreSQL rate limit", () => {
  const migration = read(
    "supabase/migrations/037_community_media_and_action_limits.sql",
  );
  const limiter = read("lib/security/action-rate-limit.ts");
  const actions = [
    read("app/community/actions.ts"),
    read("app/campaigns/actions.ts"),
    read("app/volunteer/actions.ts"),
    read("app/corporate/actions.ts"),
    read("app/ngos/[id]/reviews/actions.ts"),
  ].join("\n");

  assert.match(migration, /action_rate_limits/);
  assert.match(migration, /consume_action_rate_limit/);
  assert.match(limiter, /server-only/);
  assert.match(limiter, /consume_action_rate_limit/);
  assert.match(actions, /enforceActionRateLimit/);
});

test("deterministic recommendations are authoritative and Gemini is optional", () => {
  const recommendations = read("lib/domain/recommendations.ts");
  const gemini = read("lib/services/gemini.ts");

  for (const signal of [
    "category",
    "skill",
    "location",
    "follow",
    "donation",
    "activity",
  ]) {
    assert.match(recommendations, new RegExp(signal, "i"));
  }

  assert.match(gemini, /timeout/i);
  assert.match(gemini, /fallback/i);
  assert.match(gemini, /zod|safeParse/i);
  assert.doesNotMatch(gemini, /service_role|email|phone/i);
});

test("Supabase Realtime has a polling fallback", () => {
  const realtime = read("lib/realtime/client.ts");

  assert.match(realtime, /postgres_changes/);
  assert.match(realtime, /setInterval|poll/i);
  assert.match(realtime, /unsubscribe|removeChannel/);
});
