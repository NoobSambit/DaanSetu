import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  const url = new URL(`../../${path}`, import.meta.url);
  assert.equal(existsSync(url), true, `Missing ${path}`);
  return readFileSync(url, "utf8");
}

test("campaign administrative decisions notify owners atomically", () => {
  const migration = source(
    "supabase/migrations/036_atomic_admin_decisions.sql",
  );

  assert.match(
    migration,
    /CREATE OR REPLACE FUNCTION public\.transition_campaign/,
  );
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /'campaign_decision'/);
  assert.match(migration, /INSERT INTO public\.audit_logs/);
  assert.match(migration, /INSERT INTO public\.notifications/);
});

test("content moderation hides or restores content with one audited RPC", () => {
  const migration = source(
    "supabase/migrations/036_atomic_admin_decisions.sql",
  );
  const actions = source("app/admin/moderation/actions.ts");

  assert.match(
    migration,
    /CREATE OR REPLACE FUNCTION public\.moderate_reported_content/,
  );
  assert.match(migration, /moderation_actions/);
  assert.match(migration, /content_reports/);
  assert.match(migration, /'moderation_decision'/);
  assert.match(actions, /z\.object/);
  assert.match(actions, /rpc\("moderate_reported_content"/);
  assert.doesNotMatch(actions, /\.from\("posts"\)[\s\S]{0,300}\.update/);
});

test("decision RPCs are authenticated and privilege checked", () => {
  const migration = source(
    "supabase/migrations/036_atomic_admin_decisions.sql",
  );

  assert.match(migration, /public\.is_admin\(\)/);
  assert.match(migration, /REVOKE ALL ON FUNCTION/);
  assert.match(migration, /GRANT EXECUTE ON FUNCTION/);
});
