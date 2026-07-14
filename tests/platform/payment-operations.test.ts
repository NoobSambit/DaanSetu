import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  financialYearForDate,
  financialYearRange,
} from "../../lib/domain/financial-year.ts";
import {
  paiseToSettlementMinor,
  settlementMinorToPaise,
} from "../../lib/domain/payment-money.ts";

function pathFor(path: string): URL {
  return new URL(`../../${path}`, import.meta.url);
}

function source(path: string): string {
  assert.equal(existsSync(pathFor(path)), true, `Missing ${path}`);
  return readFileSync(pathFor(path), "utf8");
}

test("Indian financial years run from April through March", () => {
  assert.equal(
    financialYearForDate(new Date("2026-03-31T12:00:00Z")),
    "2025-26",
  );
  assert.equal(
    financialYearForDate(new Date("2026-04-01T00:00:00Z")),
    "2026-27",
  );
  assert.deepEqual(financialYearRange("2025-26"), {
    startsAt: "2025-04-01T00:00:00.000Z",
    endsBefore: "2026-04-01T00:00:00.000Z",
  });
});

test("PayPal settlement conversion uses integer minor units consistently", () => {
  assert.equal(paiseToSettlementMinor(8_300, 83), 100);
  assert.equal(settlementMinorToPaise(100, 83), 8_300);
  assert.equal(paiseToSettlementMinor(8_301, 83), 100);
});

test("admin refunds execute through PayPal and reconcile atomically", () => {
  const provider = source("lib/payments/paypal.ts");
  const action = source("app/admin/refunds/actions.ts");
  const migration = source(
    "supabase/migrations/024_paypal_financial_operations.sql",
  );

  assert.match(provider, /refundPayPalCapture/);
  assert.match(action, /requireAdmin/);
  assert.match(action, /refundPayPalCapture/);
  assert.match(action, /complete_paypal_refund/);
  assert.match(migration, /FOR UPDATE/);
  assert.match(migration, /partially_refunded|refunded/);
  assert.match(migration, /gateway_refund_id/);
});

test("refund reconciliation removes refunded value from campaign progress", () => {
  const migration = source(
    "supabase/migrations/038_complete_financial_reconciliation.sql",
  );

  assert.match(
    migration,
    /CREATE OR REPLACE FUNCTION public\.complete_paypal_refund/,
  );
  assert.match(migration, /UPDATE public\.campaigns/);
  assert.match(migration, /raised_paise = GREATEST/);
  assert.match(migration, /refunded_amount_paise/);
});

test("PayPal webhooks reconcile refunds and subscription lifecycle events", () => {
  const webhook = source("app/api/payment/webhook/route.ts");

  for (const event of [
    "PAYMENT.CAPTURE.REFUNDED",
    "PAYMENT.CAPTURE.REVERSED",
    "BILLING.SUBSCRIPTION.ACTIVATED",
    "BILLING.SUBSCRIPTION.SUSPENDED",
    "BILLING.SUBSCRIPTION.CANCELLED",
    "BILLING.SUBSCRIPTION.PAYMENT.FAILED",
  ]) {
    assert.match(webhook, new RegExp(event.replaceAll(".", "\\.")));
  }
});

test("financial-year and Form 10BD exports exist and exclude demos", () => {
  const donorSummary = source("app/dashboard/giving/financial-year/route.ts");
  const form10bd = source("app/ngo/dashboard/tax/10bd/route.ts");

  assert.match(donorSummary, /financialYearRange/);
  assert.match(donorSummary, /is_demo/);
  assert.match(form10bd, /financialYearRange/);
  assert.match(form10bd, /is_demo/);
  assert.match(form10bd, /tax_exemption_80g/);
  assert.match(form10bd, /text\/csv/);
});

test("NGOs can submit payout recipients and admins control activation", () => {
  const ownerActions = source("app/ngo/dashboard/payouts/actions.ts");
  const adminActions = source("app/admin/payouts/actions.ts");

  assert.match(ownerActions, /z\.string\(\)\.email/);
  assert.match(ownerActions, /status:\s*"pending"/);
  assert.match(adminActions, /requireAdmin/);
  assert.match(adminActions, /active|rejected|restricted/);
  assert.match(adminActions, /audit_logs/);
});
