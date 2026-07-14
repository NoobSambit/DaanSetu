import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function source(path: string) {
  const url = new URL(`../../${path}`, import.meta.url);
  assert.equal(existsSync(url), true, `Missing ${path}`);
  return readFileSync(url, "utf8");
}

test("NGO verification uses the complete submitted review state machine", () => {
  const migration = source(
    "supabase/migrations/035_secure_ngo_verification_workflow.sql",
  );

  for (const state of [
    "draft",
    "submitted",
    "changes_requested",
    "verified",
    "rejected",
    "expired",
  ]) {
    assert.match(migration, new RegExp(`'${state}'`));
  }

  assert.match(migration, /submit_ngo_verification/);
  assert.match(migration, /review_ngo_verification/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /ngo_verification_documents/);
});

test("verification submission and review are atomic audited RPC operations", () => {
  const profileActions = source("app/ngo/profile/actions.ts");
  const adminActions = source("app/admin/ngo-verifications/actions.ts");
  const adminPage = source("app/admin/ngo-verifications/page.tsx");
  const migration = source(
    "supabase/migrations/035_secure_ngo_verification_workflow.sql",
  );

  assert.match(profileActions, /rpc\("submit_ngo_verification"/);
  assert.doesNotMatch(profileActions, /verification_status: "pending"/);
  assert.match(adminActions, /z\.object/);
  assert.match(adminActions, /rpc\("review_ngo_verification"/);
  assert.match(adminPage, /changes_requested/);
  assert.match(migration, /INSERT INTO public\.audit_logs/);
  assert.match(migration, /INSERT INTO public\.notifications/);
});

test("owners can revise only editable verification states", () => {
  const migration = source(
    "supabase/migrations/035_secure_ngo_verification_workflow.sql",
  );

  assert.match(
    migration,
    /verification_status IN \('draft', 'changes_requested', 'rejected'\)/,
  );
  assert.match(migration, /WITH CHECK/);
  assert.match(migration, /REVOKE (?:ALL|EXECUTE)/);
  assert.match(migration, /GRANT EXECUTE/);
});
