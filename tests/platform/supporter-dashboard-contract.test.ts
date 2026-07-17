import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

function source(path: string): string {
  const url = new URL(`../../${path}`, import.meta.url);
  assert.equal(existsSync(url), true, `Missing ${path}`);
  return readFileSync(url, "utf8");
}

test("signed-in supporter routes share a compact top navigation shell", () => {
  const layout = source("app/dashboard/layout.tsx");
  const shell = source("app/dashboard/components/SupporterShell.tsx");

  assert.match(layout, /SupporterShell/);
  assert.match(shell, /sticky top-0/);
  assert.doesNotMatch(shell, /<aside/);

  for (const route of [
    "/dashboard",
    "/ngos",
    "/campaigns",
    "/volunteer/opportunities",
    "/community",
    "/dashboard/giving",
  ]) {
    assert.match(shell, new RegExp(route.replaceAll("/", "\\/")));
  }
});

test("dashboard is a populated supporter workspace instead of stacked empty modules", () => {
  const dashboard = source("app/dashboard/page.tsx");

  for (const label of [
    "Welcome back",
    "Your next best opportunity",
    "Complete your impact profile",
    "Causes for you",
    "Campaigns making a difference",
    "Upcoming volunteer opportunities",
    "Your impact journey",
    "Organizations you follow",
    "NGO updates",
    "Quick actions",
  ]) {
    assert.match(dashboard, new RegExp(label, "i"));
  }

  assert.match(dashboard, /getSupporterDashboard/);
  assert.doesNotMatch(dashboard, /BadgesDisplay/);
  assert.doesNotMatch(dashboard, /AIRecommendations/);
  assert.doesNotMatch(dashboard, /Get Recommendations/);
});

test("dashboard follows the mockup activity composition and readable type scale", () => {
  const dashboard = source("app/dashboard/page.tsx");

  assert.match(dashboard, /data-dashboard-zone="activity-grid"/);
  assert.match(dashboard, /lg:grid-cols-\[minmax\(0,1fr\)_300px\]/);
  assert.match(dashboard, /lg:row-span-2/);
  assert.match(dashboard, /dashboard\.impactJourney/);
  assert.doesNotMatch(dashboard, /text-\[(?:8|9)px\]/);
});

test("volunteer opportunity cards expose compact decision-making metadata", () => {
  const dashboard = source("app/dashboard/page.tsx");

  assert.match(dashboard, /spots available/i);
  assert.match(dashboard, /requiredSkills/);
  assert.match(dashboard, /mt-auto/);
});

test("impact journey is built from durable supporter activity", () => {
  const service = source("lib/services/supporter-dashboard.ts");

  assert.match(service, /impactJourney/);
  assert.match(service, /contribution/);
  assert.match(service, /volunteer/);
  assert.match(service, /application/);
  assert.match(service, /follow/);
});

test("dashboard server read model is reliable and remains identity scoped", () => {
  const service = source("lib/services/supporter-dashboard.ts");

  assert.match(service, /createAdminClient/);
  for (const scope of [
    /\.eq\("id", userId\)/,
    /\.eq\("user_id", userId\)/,
    /\.eq\("follower_id", userId\)/,
  ]) {
    assert.match(service, scope);
  }
});

test("dashboard distinguishes unavailable data from a legitimate first-time state", () => {
  const service = source("lib/services/supporter-dashboard.ts");
  const dashboard = source("app/dashboard/page.tsx");

  assert.match(service, /dataWarnings/);
  assert.match(service, /dashboard_fixture/);
  assert.match(dashboard, /dataWarnings/);
  assert.match(dashboard, /Preview data/);
});

test("supporter fixtures are idempotent and financially isolated", () => {
  const seeder = source("scripts/seed-supporter-dashboard.ts");

  assert.match(seeder, /sambitpradhan\.dev2004@gmail\.com/);
  assert.match(seeder, /dashboard_fixture/);
  assert.match(seeder, /is_demo:\s*true/);
  assert.match(seeder, /upsert/);
  assert.doesNotMatch(seeder, /is_demo:\s*false/);
});
