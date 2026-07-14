import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import {
  normalizeEmail,
  validatePassword,
  validateSignUpInput,
} from "../../lib/auth/validation.ts";
import {
  getPostAuthDestination,
  getSafeRedirectPath,
} from "../../lib/auth/redirects.ts";

test("normalizes email addresses before authentication", () => {
  assert.equal(normalizeEmail("  Person@Example.COM  "), "person@example.com");
});

test("requires a strong password without silently trimming it", () => {
  assert.equal(
    validatePassword("Short1!"),
    "Password must be at least 12 characters.",
  );
  assert.equal(
    validatePassword("alllowercase1!"),
    "Password must include uppercase, lowercase, number, and special character.",
  );
  assert.equal(validatePassword("Strong Password1!"), null);
});

test("accepts only self-service account types", () => {
  const valid = validateSignUpInput({
    name: "Asha Verma",
    email: "asha@example.com",
    password: "Strong Password1!",
    confirmPassword: "Strong Password1!",
    accountType: "ngo",
  });

  assert.equal(valid.success, true);

  const invalid = validateSignUpInput({
    name: "Asha Verma",
    email: "asha@example.com",
    password: "Strong Password1!",
    confirmPassword: "Strong Password1!",
    accountType: "admin",
  });

  assert.equal(invalid.success, false);
  if (!invalid.success) {
    assert.equal(
      invalid.fieldErrors.accountType,
      "Choose a valid account type.",
    );
  }
});

test("rejects mismatched passwords and malformed profile data", () => {
  const result = validateSignUpInput({
    name: "A",
    email: "not-an-email",
    password: "Strong Password1!",
    confirmPassword: "Different Password1!",
    accountType: "supporter",
  });

  assert.equal(result.success, false);
  if (!result.success) {
    assert.equal(result.fieldErrors.name, "Enter your full name.");
    assert.equal(result.fieldErrors.email, "Enter a valid email address.");
    assert.equal(result.fieldErrors.confirmPassword, "Passwords do not match.");
  }
});

test("allows internal return paths and blocks open redirects", () => {
  assert.equal(
    getSafeRedirectPath("/dashboard?tab=impact"),
    "/dashboard?tab=impact",
  );
  assert.equal(getSafeRedirectPath("//evil.example/path"), "/dashboard");
  assert.equal(getSafeRedirectPath("https://evil.example/path"), "/dashboard");
  assert.equal(getSafeRedirectPath("/\\evil.example"), "/dashboard");
  assert.equal(getSafeRedirectPath(null, "/ngos"), "/ngos");
});

test("uses account-aware onboarding destinations when no return path exists", () => {
  assert.equal(getPostAuthDestination("corporate"), "/corporate/profile");
  assert.equal(getPostAuthDestination("ngo"), "/ngo/profile");
  assert.equal(getPostAuthDestination("supporter"), "/dashboard");
  assert.equal(getPostAuthDestination("admin"), "/admin/analytics");
});

test("account security supports explicit global session revocation", () => {
  const actions = readFileSync(
    new URL("../../app/auth/actions.ts", import.meta.url),
    "utf8",
  );

  assert.match(actions, /revokeAllSessionsAction/);
  assert.match(actions, /signOut\(\{\s*scope:\s*"global"\s*\}\)/);
  assert.equal(
    existsSync(
      new URL("../../app/dashboard/security/page.tsx", import.meta.url),
    ),
    true,
  );
});

test("verified-page redirects use a real email verification destination", () => {
  for (const path of [
    "../../app/corporate/settlements/page.tsx",
    "../../app/ngo/dashboard/tax/page.tsx",
    "../../app/community/create/page.tsx",
  ]) {
    const page = readFileSync(new URL(path, import.meta.url), "utf8");
    assert.doesNotMatch(page, /\/verify-email/);
    assert.match(page, /\/check-email/);
  }
});
