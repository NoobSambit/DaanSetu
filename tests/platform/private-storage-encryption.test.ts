import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  decryptSensitiveBytes,
  encryptSensitiveBytes,
} from "../../lib/security/encryption.ts";

const KEY = Buffer.alloc(32, 11).toString("base64");

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
}

test("private file bytes use randomized authenticated encryption", () => {
  const plaintext = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
  const first = encryptSensitiveBytes(
    plaintext,
    "verification:document-1",
    KEY,
  );
  const second = encryptSensitiveBytes(
    plaintext,
    "verification:document-1",
    KEY,
  );

  assert.notDeepEqual(first, second);
  assert.deepEqual(
    decryptSensitiveBytes(first, "verification:document-1", KEY),
    plaintext,
  );
  first[first.length - 1] ^= 1;
  assert.throws(
    () => decryptSensitiveBytes(first, "verification:document-1", KEY),
    /decrypt/i,
  );
});

test("new private storage records declare encryption while legacy rows remain readable", () => {
  const migration = source(
    "supabase/migrations/027_private_storage_encryption.sql",
  );

  assert.match(
    migration,
    /ngo_verification_documents[\s\S]*encryption_version/i,
  );
  assert.match(migration, /tax_certificates[\s\S]*encryption_version/i);
  assert.match(migration, /CHECK \(encryption_version IN \(1\)\)/i);
});

test("verification uploads encrypt bytes and downloads enforce admin authorization", () => {
  const upload = source("app/api/ngo/verification-documents/route.ts");
  const download = source("app/api/ngo/verification-documents/[id]/route.ts");
  const reviewPage = source("app/admin/ngo-verifications/page.tsx");

  assert.match(upload, /encryptSensitiveBytes/);
  assert.match(upload, /application\/octet-stream/);
  assert.match(upload, /encryption_version:\s*1/);
  assert.match(download, /requireAdmin|role !== "admin"/);
  assert.match(download, /decryptSensitiveBytes/);
  assert.match(download, /Cache-Control[\s\S]*private, no-store/);
  assert.doesNotMatch(reviewPage, /createSignedUrl/);
});

test("official 10BE uploads are encrypted and mapped downloads check ownership", () => {
  const upload = source("app/ngo/dashboard/tax/actions.ts");
  const download = source("app/api/tax-certificates/[id]/route.ts");

  assert.match(upload, /encryptSensitiveBytes/);
  assert.match(upload, /encryption_version:\s*1/);
  assert.match(download, /donation\.user_id|ngo\.user_id|isAdmin/);
  assert.match(download, /decryptSensitiveBytes/);
  assert.match(download, /application\/pdf/);
});
