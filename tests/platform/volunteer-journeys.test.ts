import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { createVolunteerCertificatePdf } from "../../lib/documents/volunteer-certificate.ts";

const read = (path: string) =>
  readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

test("opportunity discovery is server-driven, filterable, paginated, and actionable", () => {
  const page = read("app/volunteer/opportunities/page.tsx");

  assert.doesNotMatch(page, /^"use client"/);
  assert.match(page, /searchParams/);
  assert.match(page, /required_skills/);
  assert.match(page, /city/);
  assert.match(page, /pageSize|page_size/);
  assert.match(page, /submitVolunteerApplicationFormAction/);
  assert.doesNotMatch(page, /applyToOpportunity|getBrowserClient/);
});

test("NGO volunteer operations use validated server actions and database state transitions", () => {
  const page = read("app/ngo/dashboard/volunteers/page.tsx");
  const actions = read("app/ngo/dashboard/volunteers/actions.ts");
  const migration = read(
    "supabase/migrations/031_complete_volunteer_operations.sql",
  );

  assert.doesNotMatch(page, /^"use client"/);
  assert.match(page, /createVolunteerOpportunityFormAction/);
  assert.match(page, /reviewVolunteerApplicationFormAction/);
  assert.match(page, /reviewVolunteerHoursFormAction/);
  assert.doesNotMatch(
    page,
    /lib\/services\/volunteer-opportunities|\bupdateApplicationStatus\b/,
  );

  assert.match(actions, /^"use server"/);
  assert.match(actions, /z\s*\.object/);
  assert.match(actions, /email_confirmed_at/);
  assert.match(actions, /review_volunteer_application/);
  assert.match(actions, /review_volunteer_hours/);
  assert.match(
    migration,
    /CREATE OR REPLACE FUNCTION public\.review_volunteer_hours/,
  );
  assert.match(migration, /skill_verifications/);
  assert.match(migration, /volunteer_certificates/);
  assert.match(migration, /notifications/);
});

test("volunteers have participation history, hour submission, verified skills, and downloadable certificates", () => {
  const dashboard = read("app/volunteer/dashboard/page.tsx");
  const certificate = read("app/api/volunteer-certificates/[id]/route.ts");

  assert.match(dashboard, /submitVolunteerHoursFormAction/);
  assert.match(dashboard, /skill_verifications/);
  assert.match(dashboard, /volunteer_certificates/);
  assert.match(dashboard, /withdrawVolunteerApplicationFormAction/);
  assert.match(certificate, /application\/pdf/);
  assert.match(certificate, /createVolunteerCertificatePdf/);
  assert.match(certificate, /user_id === user\.id/);
});

test("volunteer certificates render as deterministic downloadable PDFs", () => {
  const pdf = createVolunteerCertificatePdf({
    certificateNumber: "DSV-TEST123",
    volunteerName: "Asha Sharma",
    ngoName: "Seva Foundation",
    opportunityTitle: "Weekend teaching",
    hoursCompleted: 12.5,
    issueDate: "2026-07-13",
  });
  const contents = pdf.toString("latin1");

  assert.match(contents, /^%PDF-1\.4/);
  assert.match(contents, /Asha Sharma/);
  assert.match(contents, /12\.50 approved service hours/);
  assert.match(contents, /DSV-TEST123/);
  assert.match(contents, /%%EOF$/);
});
