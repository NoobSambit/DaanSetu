import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function migration(name: string): string {
  return readFileSync(
    new URL(`../../supabase/migrations/${name}`, import.meta.url),
    "utf8",
  );
}

test("performance indexes use columns created by the migration baseline", () => {
  const baseline = migration("006_platform_baseline.sql");
  const indexes = migration("012_performance_indexes.sql");

  assert.match(baseline, /analytics_logs[\s\S]*created_at/);
  assert.doesNotMatch(indexes, /analytics_logs\(event_type, timestamp/);
  assert.match(indexes, /analytics_logs\(event_type, created_at DESC\)/);
});

test("NGO verification creates its derived 80G eligibility column before use", () => {
  const verification = migration("035_secure_ngo_verification_workflow.sql");
  const addition = verification.indexOf(
    "ADD COLUMN IF NOT EXISTS tax_exemption_80g",
  );
  const update = verification.indexOf("SET tax_exemption_80g");

  assert.ok(addition >= 0);
  assert.ok(update > addition);
  assert.match(
    verification,
    /tax_exemption_80g BOOLEAN NOT NULL DEFAULT FALSE/,
  );
});

test("the final migration removes unused generated surfaces and locks internals", () => {
  const cleanup = migration(
    "040_remove_legacy_surfaces_and_lock_internal_tables.sql",
  );

  for (const table of [
    "campaign_templates",
    "campaign_collaborators",
    "custom_reports",
    "search_index",
    "translations",
    "platform_settings",
    "tax_receipts",
    "recurring_donations",
  ]) {
    assert.match(cleanup, new RegExp(`DROP TABLE IF EXISTS public\\.${table}`));
  }

  for (const table of [
    "action_rate_limits",
    "email_queue",
    "payment_events",
    "csr_match_pledges",
    "csr_settlements",
  ]) {
    assert.match(cleanup, new RegExp(`REVOKE ALL ON TABLE public\\.${table}`));
  }
});

test("the money model is paise-only and supporter donations may omit an NGO", () => {
  const normalization = migration(
    "041_normalize_money_and_public_profiles.sql",
  );

  assert.match(normalization, /ALTER COLUMN ngo_id DROP NOT NULL/);
  assert.match(normalization, /DROP COLUMN goal_amount/);
  assert.match(normalization, /DROP COLUMN current_amount/);
  assert.match(normalization, /DROP COLUMN amount,/);
  assert.match(normalization, /DROP COLUMN payment_status/);
  assert.match(normalization, /SUM\(d\.amount_paise - d\.refunded_paise\)/);
  assert.doesNotMatch(
    normalization,
    /INSERT INTO public\.donations \([\s\S]{0,500}\bamount\s*,/,
  );
});

test("authenticated profile reads cannot select account email addresses", () => {
  const normalization = migration(
    "041_normalize_money_and_public_profiles.sql",
  );

  assert.match(
    normalization,
    /GRANT SELECT \(id, name, role, created_at, updated_at\)/,
  );
  assert.doesNotMatch(normalization, /GRANT SELECT \([^)]*email/);
});
