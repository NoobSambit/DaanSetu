import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function source(path: string): string {
  const url = new URL(`../../${path}`, import.meta.url);
  assert.equal(existsSync(url), true, `Missing ${path}`);
  return readFileSync(url, "utf8");
}

test("dashboard financial aggregates use net non-demo transactions", () => {
  const analytics = source("lib/services/analytics.ts");
  const supporter = source("app/dashboard/page.tsx");

  assert.match(analytics, /server-only/);
  assert.doesNotMatch(analytics, /getBrowserClient/);
  assert.match(analytics, /refunded_paise/);
  assert.match(analytics, /partially_refunded/);
  assert.match(analytics, /is_demo/);
  assert.match(supporter, /refunded_paise/);
  assert.match(supporter, /partially_refunded/);
});

test("NGO impact report download is an authenticated server boundary", () => {
  const button = source(
    "app/ngo/dashboard/analytics/components/DownloadReportButton.tsx",
  );
  const route = source("app/api/ngo/reports/impact/route.ts");

  assert.doesNotMatch(button, /lib\/services\/analytics/);
  assert.match(button, /\/api\/ngo\/reports\/impact/);
  assert.match(route, /auth\.getUser/);
  assert.match(route, /user_id/);
  assert.match(route, /text\/csv/);
});

test("public leaderboards use server-only net aggregates without exposing email", () => {
  const leaderboard = source("lib/services/leaderboard.ts");

  assert.match(leaderboard, /server-only/);
  assert.match(leaderboard, /createAdminClient/);
  assert.match(leaderboard, /refunded_paise/);
  assert.match(leaderboard, /is_demo/);
  assert.doesNotMatch(leaderboard, /user_email/);
  assert.doesNotMatch(leaderboard, /\.select\([\s\S]{0,200}email/);
});
