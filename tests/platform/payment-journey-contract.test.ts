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

test("Razorpay order, verification, webhook, and reconciliation boundaries exist", () => {
  const createOrder = source("app/api/payment/create-order/route.ts");
  const verify = source("app/api/payment/verify/route.ts");
  const webhook = source("app/api/payment/webhook/route.ts");

  assert.match(createOrder, /razorpay\.orders\.create|orders\.create/);
  assert.match(createOrder, /amountPaise|amount_paise/);
  assert.match(verify, /timingSafeEqual|createHmac/);
  assert.match(verify, /payments\.fetch/);
  assert.match(webhook, /request\.text\(\)/);
  assert.match(webhook, /x-razorpay-signature/i);
  assert.match(webhook, /gateway_event_id|payment_events/);
});

test("recurring giving exposes create and lifecycle controls", () => {
  const subscriptions = source("app/api/payment/subscriptions/route.ts");
  const verify = source("app/api/payment/subscriptions/verify/route.ts");

  assert.match(subscriptions, /monthly|quarterly|yearly/);
  assert.match(subscriptions, /pause|resume|cancel/);
  assert.match(verify, /createHmac|timingSafeEqual/);
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
