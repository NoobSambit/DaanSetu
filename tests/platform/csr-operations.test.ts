import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("corporates configure matching initiatives and settle outstanding pledges", () => {
  const actions = read("app/corporate/actions.ts");
  const page = read("app/corporate/settlements/page.tsx");
  const button = read("app/corporate/settlements/CsrSettlementButton.tsx");

  assert.match(actions, /createCsrInitiativeFormAction/);
  assert.match(page, /csr_match_pledges/);
  assert.match(page, /CsrSettlementButton/);
  assert.match(button, /api\/csr\/settlements/);
  assert.match(actions, /\.eq\("is_verified", true\)/);
});

test("PayPal CSR capture validates provider totals before allocating matches", () => {
  const createRoute = read("app/api/csr/settlements/route.ts");
  const captureRoute = read("app/api/csr/settlements/capture/route.ts");
  const migration = read("supabase/migrations/034_complete_csr_operations.sql");

  assert.match(createRoute, /provider_amount_cents/);
  assert.match(captureRoute, /capturePayPalOrder/);
  assert.match(captureRoute, /capture_csr_settlement/);
  assert.match(
    migration,
    /CREATE OR REPLACE FUNCTION public\.capture_csr_settlement/,
  );
  assert.match(migration, /allocated_donation_id/);
  assert.match(migration, /is_csr_match/);
});

test("CSR settlement capture is a same-origin rate-limited POST", () => {
  const createRoute = read("app/api/csr/settlements/route.ts");
  const captureRoute = read("app/api/csr/settlements/capture/route.ts");
  const returnPage = read("app/corporate/settlements/paypal-return/page.tsx");

  assert.match(createRoute, /corporate\/settlements\/paypal-return/);
  assert.doesNotMatch(captureRoute, /export async function GET/);
  assert.match(captureRoute, /hasValidRequestOrigin/);
  assert.match(captureRoute, /rateLimit\(RATE_LIMITS\.PAYMENT\)/);
  assert.match(returnPage, /method: "POST"/);
});

test("CSR campaigns use integer paise as their authoritative money fields", () => {
  const migration = read("supabase/migrations/034_complete_csr_operations.sql");
  const actions = read("app/corporate/actions.ts");

  assert.match(migration, /goal_paise BIGINT/);
  assert.match(migration, /raised_paise BIGINT/);
  assert.match(actions, /goal_paise/);
});

test("cancelled and reversed CSR settlements release or reverse pledges", () => {
  const migration = read(
    "supabase/migrations/038_complete_financial_reconciliation.sql",
  );
  const captureRoute = read("app/api/csr/settlements/capture/route.ts");
  const settlementRoute = read("app/api/csr/settlements/route.ts");
  const webhook = read("app/api/payment/webhook/route.ts");

  assert.match(migration, /cancel_csr_settlement/);
  assert.match(migration, /reverse_csr_settlement/);
  assert.match(migration, /status = 'outstanding'/);
  assert.match(migration, /status = 'reversed'/);
  assert.match(captureRoute, /action[\s\S]*cancel/);
  assert.match(settlementRoute, /paypal-cancel/);
  assert.match(webhook, /reverse_csr_settlement/);
});
