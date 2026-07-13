import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proxySource = readFileSync(
  new URL("../../proxy.ts", import.meta.url),
  "utf8",
);

test("allows same-origin geolocation for the NGO profile location picker", () => {
  assert.match(proxySource, /geolocation=\(self\)/);
  assert.doesNotMatch(proxySource, /geolocation=\(\)/);
});

test("allows Google-hosted font stylesheets and font files in CSP", () => {
  assert.match(proxySource, /style-src[^"]*https:\/\/fonts\.googleapis\.com/);
  assert.match(proxySource, /font-src[^"]*https:\/\/fonts\.gstatic\.com/);
});
