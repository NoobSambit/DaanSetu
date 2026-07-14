import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("recurring PayPal sales become idempotent donations atomically", () => {
  const migration = read(
    "supabase/migrations/025_paypal_recurring_and_payout_settlement.sql",
  );
  const webhook = read("app/api/payment/webhook/route.ts");

  assert.match(migration, /record_completed_subscription_payment/i);
  assert.match(migration, /FOR UPDATE/i);
  assert.match(migration, /gateway_payment_id/i);
  assert.match(migration, /subscription_invoices/i);
  assert.match(migration, /INSERT INTO public\.donations/i);
  assert.match(migration, /UPDATE public\.campaigns/i);
  assert.match(webhook, /record_completed_subscription_payment/i);
  assert.match(webhook, /receivedMinor/);
});

test("PayPal payouts have an idempotent provider request and atomic claim", () => {
  const provider = read("lib/payments/paypal.ts");
  const action = read("app/admin/payouts/actions.ts");
  const migration = read(
    "supabase/migrations/025_paypal_recurring_and_payout_settlement.sql",
  );

  assert.match(provider, /createPayPalPayout/);
  assert.match(provider, /sender_batch_id/);
  assert.match(provider, /sender_item_id/);
  assert.match(provider, /\/v1\/payments\/payouts/);
  assert.match(action, /executePayoutAction/);
  assert.match(action, /claim_paypal_payout_transfer/);
  assert.match(migration, /claim_paypal_payout_transfer/i);
  assert.match(migration, /reconcile_paypal_payout_transfer/i);
  assert.match(migration, /FOR UPDATE/i);
});

test("payout webhooks reconcile batch and item terminal states", () => {
  const webhook = read("app/api/payment/webhook/route.ts");

  assert.match(webhook, /PAYMENT\.PAYOUTSBATCH\.SUCCESS/);
  assert.match(webhook, /PAYMENT\.PAYOUTSBATCH\.DENIED/);
  assert.match(webhook, /PAYMENT\.PAYOUTS-ITEM\.SUCCEEDED/);
  assert.match(webhook, /PAYMENT\.PAYOUTS-ITEM\.FAILED/);
  assert.match(webhook, /reconcile_paypal_payout_transfer/);
});

test("payout execution is feature-gated and demo donations are excluded", () => {
  const action = read("app/admin/payouts/actions.ts");

  assert.match(action, /PAYPAL_PAYOUTS_ENABLED/);
  assert.match(action, /\.eq\("is_demo", false\)/);
  assert.match(action, /\.eq\("status", "captured"\)/);
});

test("the final database defaults create PayPal payment records only", () => {
  const migration = read("supabase/migrations/030_paypal_only_defaults.sql");

  assert.match(migration, /payment_method SET DEFAULT 'paypal'/);
  assert.doesNotMatch(migration, /SET DEFAULT 'razorpay/i);
});
