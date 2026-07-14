import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function projectPath(path: string): URL {
  return new URL(`../../${path}`, import.meta.url);
}

function source(path: string): string {
  assert.equal(existsSync(projectPath(path)), true, `Missing ${path}`);
  return readFileSync(projectPath(path), "utf8");
}

test("donation processing has no simulated success path", () => {
  const donations = source("lib/services/donations.ts");

  assert.doesNotMatch(donations, /simulat|placeholder|Math\.random/i);
});

test("PayPal order, capture, webhook, and reconciliation boundaries exist", () => {
  const createOrder = source("app/api/payment/create-order/route.ts");
  const capture = source("app/api/payment/capture/route.ts");
  const webhook = source("app/api/payment/webhook/route.ts");
  const provider = source("lib/payments/paypal.ts");

  assert.match(createOrder, /createPayPalOrder/);
  assert.match(createOrder, /amountPaise|amount_paise/);
  assert.match(capture, /capturePayPalOrder/);
  assert.match(provider, /v2\/checkout\/orders/);
  assert.match(webhook, /verifyPayPalWebhook/);
  assert.match(webhook, /paypal-transmission-id/i);
  assert.match(webhook, /gateway_event_id|payment_events/);
});

test("PayPal recurring giving exposes create and lifecycle controls", () => {
  const subscriptions = source("app/api/payment/subscriptions/route.ts");

  assert.match(subscriptions, /monthly|quarterly|yearly/);
  assert.match(subscriptions, /pause|resume|cancel/);
  assert.match(subscriptions, /PayPal|paypal/i);
});

test("demo payments are isolated, gated, and excluded from real totals", () => {
  const demoRoute = source("app/api/demo/payments/route.ts");
  const migration = source(
    "supabase/migrations/019_paypal_payment_processing.sql",
  );

  assert.match(demoRoute, /ENABLE_DEMO_PAYMENTS/);
  assert.match(demoRoute, /NODE_ENV/);
  assert.match(demoRoute, /isDemo|is_demo/);
  assert.match(demoRoute, /payout_accounts\(status\)/);
  assert.match(demoRoute, /payout\?\.status !== "active"/);
  assert.match(migration, /is_demo/);
  assert.match(migration, /WHERE[\s\S]+is_demo\s*=\s*FALSE/i);
});

test("payouts, refunds, receipts, and statutory routes exist", () => {
  for (const path of [
    "app/dashboard/giving/page.tsx",
    "app/dashboard/giving/actions.ts",
    "app/api/receipts/[id]/route.ts",
    "app/refund-policy/page.tsx",
    "app/grievance/page.tsx",
    "app/ngo/dashboard/tax/page.tsx",
    "app/ngo/dashboard/payouts/page.tsx",
    "app/admin/refunds/page.tsx",
  ]) {
    assert.equal(existsSync(projectPath(path)), true, `Missing ${path}`);
  }

  const payoutMigration = source(
    "supabase/migrations/022_paypal_payout_provider.sql",
  );
  assert.match(payoutMigration, /DEFAULT 'paypal'/);
});

test("official Form 10BE is uploaded rather than manufactured", () => {
  const productionSources = [
    source("app/ngo/dashboard/tax/page.tsx"),
    source("app/ngo/dashboard/tax/actions.ts"),
  ].join("\n");

  assert.match(productionSources, /upload/i);
  assert.match(productionSources, /10BE/);
  assert.doesNotMatch(productionSources, /generate.*10BE|create.*10BE/i);
});
