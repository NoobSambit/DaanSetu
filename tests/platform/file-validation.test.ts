import assert from "node:assert/strict";
import test from "node:test";

import { validateOfficialPdf } from "../../lib/storage/file-validation.ts";

function pdfFile(
  bytes: number[],
  name = "certificate.pdf",
  type = "application/pdf",
) {
  return new File([new Uint8Array(bytes)], name, { type });
}

test("accepts a PDF with matching extension, MIME type, and magic bytes", async () => {
  await assert.doesNotReject(
    validateOfficialPdf(pdfFile([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])),
  );
});

test("rejects extension and MIME mismatches", async () => {
  await assert.rejects(
    validateOfficialPdf(
      pdfFile([0x25, 0x50, 0x44, 0x46, 0x2d], "certificate.txt"),
    ),
    /extension and MIME/i,
  );
  await assert.rejects(
    validateOfficialPdf(
      pdfFile([0x25, 0x50, 0x44, 0x46, 0x2d], "certificate.pdf", "text/plain"),
    ),
    /extension and MIME/i,
  );
});

test("rejects forged PDF content and oversized files", async () => {
  await assert.rejects(
    validateOfficialPdf(pdfFile([0x50, 0x4e, 0x47, 0x00, 0x00])),
    /not a valid PDF/i,
  );
  await assert.rejects(
    validateOfficialPdf(pdfFile([0x25, 0x50, 0x44, 0x46, 0x2d]), 4),
    /size is invalid/i,
  );
});
