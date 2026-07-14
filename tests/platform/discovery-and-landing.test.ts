import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  parseCampaignDiscoveryParams,
  parseNgoDiscoveryParams,
} from "../../lib/discovery/filters.ts";

function projectPath(path: string): URL {
  return new URL(`../../${path}`, import.meta.url);
}

function source(path: string): string {
  assert.equal(existsSync(projectPath(path)), true, `Missing ${path}`);
  return readFileSync(projectPath(path), "utf8");
}

test("NGO discovery normalizes every public filter and bounds pagination", () => {
  const filters = parseNgoDiscoveryParams({
    search: "  clean WATER  ",
    category: "environment",
    state: " Karnataka ",
    city: " Bengaluru ",
    verified: "true",
    has80g: "true",
    volunteering: "true",
    csr: "true",
    latitude: "12.9716",
    longitude: "77.5946",
    distanceKm: "25",
    page: "9999",
    pageSize: "500",
    sort: "distance",
  });

  assert.deepEqual(filters, {
    search: "clean WATER",
    category: "environment",
    state: "Karnataka",
    city: "Bengaluru",
    verified: true,
    has80g: true,
    volunteering: true,
    csr: true,
    latitude: 12.9716,
    longitude: 77.5946,
    distanceKm: 25,
    page: 100,
    pageSize: 48,
    sort: "distance",
  });
});

test("invalid distance coordinates are removed as one atomic filter", () => {
  const filters = parseNgoDiscoveryParams({
    latitude: "200",
    longitude: "77.5",
    distanceKm: "10",
    verified: "false",
  });

  assert.equal(filters.latitude, undefined);
  assert.equal(filters.longitude, undefined);
  assert.equal(filters.distanceKm, undefined);
  assert.equal(filters.verified, false);
});

test("campaign discovery has URL-stable text, category, sort, and pagination", () => {
  assert.deepEqual(
    parseCampaignDiscoveryParams({
      search: "  school meals ",
      category: "food",
      sort: "ending-soon",
      page: "2",
      pageSize: "12",
    }),
    {
      search: "school meals",
      category: "food",
      sort: "ending-soon",
      page: 2,
      pageSize: 12,
    },
  );
});

test("discovery pages are server-driven and synchronize list and map selection", () => {
  const ngosPage = source("app/ngos/page.tsx");
  const campaignsPage = source("app/campaigns/page.tsx");
  const explorer = source("components/discovery/NgoExplorer.tsx");

  assert.doesNotMatch(campaignsPage, /^"use client"/);
  assert.match(ngosPage, /parseNgoDiscoveryParams/);
  assert.match(campaignsPage, /parseCampaignDiscoveryParams/);
  assert.match(explorer, /selectedNgoId/);
  assert.match(explorer, /NGOMap/);
  assert.match(explorer, /NGOList/);
});

test("landing content comes from approved Supabase records without demo totals", () => {
  const repository = source("lib/landing/repository.ts");
  const home = source("app/page.tsx");
  const story = source("components/landing/StorySection.tsx");
  const dashboard = source("components/landing/ImpactDashboard.tsx");
  const causes = source("components/landing/CausesSection.tsx");
  const trust = source("components/landing/TrustSection.tsx");
  const map = source("components/landing/IndiaMap.tsx");

  assert.match(repository, /is_demo/);
  assert.match(repository, /refunded_paise/);
  assert.match(repository, /partially_refunded/);
  assert.match(repository, /count: "exact"/);
  assert.match(repository, /featured_at|is_featured/);
  assert.match(repository, /hidden_at|approved/i);
  assert.match(home, /getLandingData/);
  assert.doesNotMatch(story, /Meena|150|98%/);
  assert.doesNotMatch(dashboard, /₹12\.4 Cr|2,500\+|28/);
  assert.doesNotMatch(causes, /Pratham|Swasth India|Jal Jeevan|₹12\.4L/);
  assert.doesNotMatch(trust, /Neha Sharma|Prerna Foundation|₹8,75,000/);
  assert.doesNotMatch(map, /const markers\s*=|Delhi|Mumbai|Bangalore/);
  assert.match(story, /No approved impact stories/i);
  assert.match(dashboard, /No platform-tracked impact yet/i);
  assert.match(causes, /No active campaigns are published yet/i);
  assert.match(trust, /No eligible reviews are available yet/i);
});

test("impact stories are public, approved, visible, and link to real routes", () => {
  const page = source("app/impact-stories/page.tsx");

  assert.doesNotMatch(page, /redirect\("\/sign-in/);
  assert.match(page, /createAdminClient/);
  assert.doesNotMatch(page, /createClient.*supabase\/server/);
  assert.match(page, /\.eq\("is_impact_story", true\)/);
  assert.match(page, /\.not\("approved_at", "is", null\)/);
  assert.match(page, /\.is\("hidden_at", null\)/);
  assert.match(page, /href={`\/community\/\$\{story\.id\}`}/);
  assert.doesNotMatch(page, /\/community\/posts\//);
});

test("public impact analytics use server-side net transactional aggregates", () => {
  const page = source("app/analytics/page.tsx");
  const repository = source("lib/impact/public-analytics.ts");

  assert.doesNotMatch(page, /^"use client"/);
  assert.match(page, /getPublicImpactAnalytics/);
  assert.match(repository, /server-only/);
  assert.match(repository, /createAdminClient/);
  assert.match(repository, /amount_paise - donation\.refunded_paise/);
  assert.match(repository, /is_demo/);
  assert.match(repository, /status.*active/);
  assert.doesNotMatch(repository, /\.limit\(6\)[\s\S]{0,300}activeCampaigns/);
});
