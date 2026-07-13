import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = new URL("../../", import.meta.url);
const migrationsDirectory = new URL(
  "../../supabase/migrations/",
  import.meta.url,
);

function readProjectFile(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

function allMigrations(): string {
  return readdirSync(migrationsDirectory)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .map((file) => readFileSync(new URL(file, migrationsDirectory), "utf8"))
    .join("\n");
}

const migrations = allMigrations();

test("Supabase remains the exclusive backend boundary", () => {
  const packageJson = readProjectFile("package.json");
  const productionSources = ["app", "components", "lib"]
    .flatMap((directory) => collectFiles(join(root.pathname, directory)))
    .filter((file) => /\.(ts|tsx)$/.test(file))
    .map((file) => readFileSync(file, "utf8"))
    .join("\n");

  assert.match(packageJson, /"@supabase\/ssr"/);
  assert.match(packageJson, /"@supabase\/supabase-js"/);
  assert.doesNotMatch(packageJson, /better-auth|drizzle-orm|"pg"/);
  assert.doesNotMatch(
    productionSources,
    /better-auth|drizzle-orm|DATABASE_URL/,
  );
});

test("the authoritative schema stores all money as integer paise", () => {
  for (const column of [
    "amount_paise",
    "target_paise",
    "refunded_paise",
    "matched_paise",
    "cap_paise",
  ]) {
    assert.match(migrations, new RegExp(`${column}\\s+BIGINT`, "i"));
  }

  assert.doesNotMatch(migrations, /goal_amount\s+DECIMAL|amount\s+DECIMAL/i);
});

test("fundraising and payment records enforce lifecycle and idempotency", () => {
  for (const table of [
    "payout_accounts",
    "payment_orders",
    "payment_events",
    "subscriptions",
    "subscription_invoices",
    "refund_requests",
    "payment_transfers",
    "tax_certificates",
  ]) {
    assert.match(
      migrations,
      new RegExp(`CREATE TABLE(?: IF NOT EXISTS)?(?: public\\.)?${table}`, "i"),
    );
  }

  assert.match(migrations, /gateway_order_id[^;]+UNIQUE/i);
  assert.match(migrations, /gateway_payment_id[^;]+UNIQUE/i);
  assert.match(migrations, /gateway_event_id[^;]+UNIQUE/i);
  assert.match(migrations, /gateway_subscription_id[^;]+UNIQUE/i);
  assert.match(
    migrations,
    /draft[\s\S]*pending_review[\s\S]*changes_requested[\s\S]*rejected[\s\S]*approved[\s\S]*active[\s\S]*paused[\s\S]*completed[\s\S]*cancelled/i,
  );
});

test("volunteering, community, moderation, and CSR have durable records", () => {
  for (const table of [
    "volunteer_applications",
    "volunteer_hours",
    "volunteer_certificates",
    "posts",
    "post_comments",
    "post_likes",
    "post_bookmarks",
    "content_reports",
    "moderation_actions",
    "notifications",
    "corporate_invitations",
    "csr_initiatives",
    "csr_match_pledges",
    "csr_settlements",
    "audit_logs",
  ]) {
    assert.match(
      migrations,
      new RegExp(`CREATE TABLE(?: IF NOT EXISTS)?(?: public\\.)?${table}`, "i"),
    );
  }
});

test("every sensitive table has RLS and unsafe client writes are revoked", () => {
  for (const table of [
    "users",
    "ngos",
    "ngo_verification_documents",
    "donations",
    "payout_accounts",
    "payment_events",
    "refund_requests",
    "volunteer_applications",
    "volunteer_hours",
    "content_reports",
    "audit_logs",
    "csr_match_pledges",
  ]) {
    assert.match(
      migrations,
      new RegExp(
        `ALTER TABLE(?: public\\.)?${table} ENABLE ROW LEVEL SECURITY`,
        "i",
      ),
    );
  }

  assert.match(
    migrations,
    /REVOKE ALL ON(?: TABLE)? public\.users FROM anon, authenticated/i,
  );
  assert.match(
    migrations,
    /REVOKE[\s\S]*payment_events[\s\S]*anon[\s\S]*authenticated/i,
  );
  assert.match(
    migrations,
    /REVOKE[\s\S]*audit_logs[\s\S]*anon[\s\S]*authenticated/i,
  );
});

test("storage policies cover public media and private statutory records", () => {
  for (const bucket of [
    "ngo-profile-assets",
    "ngo-verification-documents",
    "community-media",
    "campaign-evidence",
    "tax-certificates",
  ]) {
    assert.match(migrations, new RegExp(`['\"]${bucket}['\"]`));
  }

  assert.match(migrations, /magic|signature|file header/i);
  assert.match(migrations, /tax-certificates[\s\S]+public[\s\S]+false/i);
});

test("obsolete unpromised generated features are removed", () => {
  for (const table of [
    "donation_gift_cards",
    "stories",
    "polls",
    "events",
    "sms_queue",
    "predictive_analytics",
  ]) {
    assert.doesNotMatch(
      migrations,
      new RegExp(`CREATE TABLE(?: IF NOT EXISTS)?(?: public\\.)?${table}`, "i"),
    );
  }
});

function collectFiles(directory: string): string[] {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? collectFiles(path) : [path];
  });
}
