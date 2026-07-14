import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  decryptSensitiveText,
  encryptSensitiveText,
} from "../../lib/security/encryption.ts";

const KEY = Buffer.alloc(32, 7).toString("base64");

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("sensitive tax identity encryption round-trips with randomized AES-GCM", () => {
  const first = encryptSensitiveText("ABCDE1234F", "tax-profile:user-1", KEY);
  const second = encryptSensitiveText("ABCDE1234F", "tax-profile:user-1", KEY);

  assert.notEqual(first, second);
  assert.match(first, /^v1\./);
  assert.equal(
    decryptSensitiveText(first, "tax-profile:user-1", KEY),
    "ABCDE1234F",
  );
  assert.throws(
    () => decryptSensitiveText(first, "tax-profile:user-2", KEY),
    /decrypt/i,
  );
});

test("tax profile schema is owner-scoped and stores no plaintext identifier", () => {
  const migration = source("supabase/migrations/026_secure_tax_identity.sql");

  assert.match(migration, /CREATE TABLE[\s\S]*donor_tax_profiles/i);
  assert.match(migration, /identifier_ciphertext/i);
  assert.match(migration, /address_ciphertext/i);
  assert.doesNotMatch(migration, /identifier_plaintext/i);
  assert.match(migration, /ENABLE ROW LEVEL SECURITY/i);
  assert.match(migration, /user_id = auth\.uid\(\)/i);
});

test("donors can maintain tax details through a validated server action", () => {
  const action = source("app/dashboard/giving/tax-profile/actions.ts");

  assert.match(action, /^"use server"/);
  assert.match(action, /z\s*\.object/);
  assert.match(action, /email_confirmed_at/);
  assert.match(action, /encryptSensitiveText/);
  assert.match(action, /hasValidRequestOrigin|server action/i);
  assert.doesNotMatch(action, /service_role|SUPABASE_SERVICE_ROLE_KEY/);
});

test("10BD preparation export rejects incomplete identities and never uses email as ID", () => {
  const route = source("app/ngo/dashboard/tax/10bd/route.ts");

  assert.match(route, /donor_tax_profiles/);
  assert.match(route, /decryptSensitiveText/);
  assert.match(route, /incomplete donor tax profiles/i);
  assert.match(route, /profile\.id_code/);
  assert.match(route, /Donor email \(contact only\)/);
  assert.doesNotMatch(
    route,
    /Unique identification number[\s\S]{0,500}donor\?\.email/,
  );
  assert.match(route, /Form-10BD-preparation/);
  assert.match(route, /tax_exemption_80g/);
  assert.doesNotMatch(route, /select\("id, has_80g"\)/);
});
