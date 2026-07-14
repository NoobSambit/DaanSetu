import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

function source(path: string): string {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("refund and payout decisions are atomic, audited, and notify owners", () => {
  const migration = source(
    "supabase/migrations/039_atomic_financial_and_csr_decisions.sql",
  );
  const refundActions = source("app/admin/refunds/actions.ts");
  const payoutActions = source("app/admin/payouts/actions.ts");

  assert.match(migration, /review_refund_request/);
  assert.match(migration, /review_payout_account/);
  assert.match(migration, /audit_logs/);
  assert.match(migration, /notifications/);
  assert.match(refundActions, /review_refund_request/);
  assert.match(payoutActions, /review_payout_account/);
});

test("CSR invitations and partnership decisions use transactional workflows", () => {
  const migration = source(
    "supabase/migrations/039_atomic_financial_and_csr_decisions.sql",
  );
  const corporateActions = source("app/corporate/actions.ts");
  const invitationActions = source("app/corporate/invitations/actions.ts");

  assert.match(migration, /create_corporate_invitation/);
  assert.match(migration, /accept_corporate_invitation/);
  assert.match(migration, /review_partnership_request/);
  assert.match(migration, /email_queue/);
  assert.match(corporateActions, /create_corporate_invitation/);
  assert.match(corporateActions, /review_partnership_request/);
  assert.match(invitationActions, /accept_corporate_invitation/);
});
