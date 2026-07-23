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

test("the application shell defaults to light mode and owns the public app chrome", () => {
  const layout = source("app/layout.tsx");
  const chrome = source("components/AppChrome.tsx");

  assert.match(layout, /data-theme="light"/);
  assert.match(layout, /ThemeProvider/);
  assert.match(layout, /AppChrome/);
  assert.match(chrome, /<Header/);
  assert.match(chrome, /isProtectedSurface/);
});

test("theme preferences are persistent, explicit, and accessible to keyboard users", () => {
  const provider = source("components/theme/ThemeProvider.tsx");
  const toggle = source("components/theme/ThemeToggle.tsx");

  assert.match(provider, /"daansetu-theme"/);
  assert.match(provider, /"light"/);
  assert.match(provider, /document\.documentElement\.dataset\.theme/);
  assert.match(toggle, /aria-label/);
  assert.match(toggle, /Switch to dark mode/);
  assert.match(toggle, /Switch to light mode/);
});

test("the shared visual foundation has tokens, responsive controls, focus treatment, and dark-mode coverage", () => {
  const styles = source("app/globals.css");
  const header = source("components/Header.tsx");

  for (const token of [
    "--background",
    "--foreground",
    "--primary",
    "--border",
    "--surface",
  ]) {
    assert.match(styles, new RegExp(token));
  }
  assert.match(styles, /html\[data-theme="dark"\]/);
  assert.match(styles, /\.btn\s*\{/);
  assert.match(styles, /\.input\s*\{/);
  assert.match(styles, /:focus-visible/);
  assert.match(styles, /prefers-reduced-motion/);
  assert.match(header, /ThemeToggle/);
  assert.match(header, /Menu/);
  assert.match(header, /Open navigation menu/);
});

test("public decision-making routes use the same responsive page and data-state primitives", () => {
  const primitives = source("components/ui/PagePrimitives.tsx");

  assert.match(primitives, /export function PageHeader/);
  assert.match(primitives, /export function MetricCard/);
  assert.match(primitives, /export function EmptyState/);

  for (const path of [
    "app/ngos/page.tsx",
    "app/campaigns/page.tsx",
    "app/analytics/page.tsx",
    "app/impact-stories/page.tsx",
    "app/leaderboard/page.tsx",
    "app/map/page.tsx",
    "app/volunteer/opportunities/page.tsx",
  ]) {
    const page = source(path);
    assert.match(page, /PageHeader/);
    assert.match(page, /page-frame/);
  }
});

test("CSR discovery avoids per-card reads and collects partnership context inside the application", () => {
  const csrPage = source("app/csr-campaigns/page.tsx");
  const partnerships = source("lib/services/partnerships.ts");

  assert.match(partnerships, /getAppliedCorporateCampaignIdsForNgo/);
  assert.match(csrPage, /getAppliedCorporateCampaignIdsForNgo/);
  assert.doesNotMatch(csrPage, /hasAppliedForPartnership/);
  assert.doesNotMatch(csrPage, /\balert\(/);
  assert.doesNotMatch(csrPage, /\bprompt\(/);
  assert.match(csrPage, /textarea/);
  assert.match(csrPage, /aria-live/);
});

test("community interactions provide responsive in-product feedback instead of browser alerts", () => {
  const communityPage = source("app/community/page.tsx");
  const postCard = source("app/community/components/EnhancedPostCard.tsx");

  assert.match(communityPage, /PageHeader/);
  assert.match(communityPage, /page-frame/);
  assert.match(postCard, /Toast/);
  assert.doesNotMatch(postCard, /\balert\(/);
  assert.match(postCard, /Bookmark post/);
  assert.match(postCard, /aria-label="Share post"/);
});

test("role workspaces retain concise, responsive navigation without sending admins to supporter routes", () => {
  const header = source("components/Header.tsx");
  const adminLayout = source("app/admin/layout.tsx");
  const corporateLayout = source("app/corporate/layout.tsx");
  const volunteerLayout = source("app/volunteer/layout.tsx");

  assert.match(header, /role === "admin"/);
  assert.match(header, /"\/admin\/operations"/);
  assert.match(adminLayout, /AdminNavigation/);
  assert.match(corporateLayout, /CorporateNavigation/);
  assert.match(volunteerLayout, /VolunteerNavigation/);
});

test("corporate overview presents live operational metrics in the shared workspace system", () => {
  const dashboard = source("app/corporate/dashboard/page.tsx");

  assert.match(dashboard, /PageHeader/);
  assert.match(dashboard, /MetricCard/);
  assert.match(dashboard, /metric-grid/);
  assert.match(dashboard, /page-frame/);
});

test("corporate operations use responsive workspace primitives and do not hide request failures", () => {
  for (const path of [
    "app/corporate/campaigns/page.tsx",
    "app/corporate/campaigns/create/page.tsx",
    "app/corporate/campaigns/[id]/page.tsx",
    "app/corporate/employees/page.tsx",
    "app/corporate/profile/page.tsx",
  ]) {
    const page = source(path);
    assert.match(page, /PageHeader/);
    assert.match(page, /page-frame/);
  }

  const detail = source("app/corporate/campaigns/[id]/page.tsx");
  assert.match(detail, /Toast/);
  assert.match(detail, /loadError/);
  assert.match(detail, /actionFeedback/);

  const settlements = source("app/corporate/settlements/page.tsx");
  assert.match(settlements, /PageHeader/);
  assert.match(settlements, /page-frame/);
  assert.match(settlements, /aria-live/);
});

test("action feedback uses accessible in-app messaging rather than blocking browser dialogs", () => {
  for (const path of [
    "components/CampaignUpdates.tsx",
    "app/ngo/dashboard/analytics/components/DownloadReportButton.tsx",
  ]) {
    const component = source(path);
    assert.match(component, /Toast/);
    assert.doesNotMatch(component, /\balert\(/);
  }
});

test("supporter and volunteer operational journeys use responsive shells and recoverable feedback", () => {
  for (const path of [
    "app/campaigns/create/page.tsx",
    "app/campaigns/[id]/page.tsx",
    "app/campaigns/[id]/manage/page.tsx",
    "app/campaigns/[id]/updates/page.tsx",
    "app/volunteer/dashboard/page.tsx",
    "app/volunteer/profile/page.tsx",
    "app/notifications/page.tsx",
  ]) {
    const page = source(path);
    assert.match(page, /PageHeader/);
    assert.match(page, /page-frame/);
  }

  const notifications = source(
    "app/notifications/components/NotificationList.tsx",
  );
  assert.match(notifications, /Toast/);
  assert.match(notifications, /EmptyState/);
  assert.match(notifications, /setNotifications\(\(current\)/);

  const volunteerProfile = source("app/volunteer/profile/page.tsx");
  assert.match(volunteerProfile, /aria-pressed/);
  assert.match(volunteerProfile, /Toast/);
});

test("admin review queues share the responsive operational shell", () => {
  for (const path of [
    "app/admin/ai-flags/page.tsx",
    "app/admin/analytics/page.tsx",
    "app/admin/audit/page.tsx",
    "app/admin/csr-settlements/page.tsx",
    "app/admin/fundraisers/page.tsx",
    "app/admin/moderation/page.tsx",
    "app/admin/ngo-verifications/page.tsx",
    "app/admin/operations/page.tsx",
    "app/admin/payouts/page.tsx",
    "app/admin/refunds/page.tsx",
  ]) {
    const page = source(path);
    assert.match(page, /PageHeader/);
    assert.match(page, /page-frame/);
  }
});

test("community, profile, and payment-result surfaces retain accessible shared shells", () => {
  for (const path of [
    "app/community/[id]/page.tsx",
    "app/community/create/page.tsx",
    "app/profile/[userId]/page.tsx",
  ]) {
    const page = source(path);
    assert.match(page, /PageHeader/);
    assert.match(page, /page-frame/);
  }

  const profile = source("app/profile/[userId]/page.tsx");
  assert.match(profile, /MetricCard/);
  assert.match(profile, /`\/community\/\$\{post\.id\}`/);

  const donationReturn = source("app/donation/paypal-return/page.tsx");
  assert.match(donationReturn, /page-frame/);
  assert.match(donationReturn, /aria-live/);
});
