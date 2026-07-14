import assert from "node:assert/strict";
import test from "node:test";

import {
  validateOfficialPdf,
  validatePrivateDocument,
  validatePublicImage,
} from "../../lib/storage/file-validation.ts";

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

test("public images require matching extension, MIME type, and magic bytes", async () => {
  await assert.doesNotReject(
    validatePublicImage(
      new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "photo.jpg", {
        type: "image/jpeg",
      }),
    ),
  );
  await assert.doesNotReject(
    validatePublicImage(
      new File(
        [
          new Uint8Array([
            0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50,
          ]),
        ],
        "photo.webp",
        { type: "image/webp" },
      ),
    ),
  );
  await assert.rejects(
    validatePublicImage(
      new File([new Uint8Array([0x3c, 0x73, 0x76, 0x67])], "photo.png", {
        type: "image/png",
      }),
    ),
    /must match/i,
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

test("private KYC documents require matching MIME, extension, and magic bytes", async () => {
  await assert.doesNotReject(
    validatePrivateDocument(pdfFile([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31])),
  );
  await assert.doesNotReject(
    validatePrivateDocument(
      new File([new Uint8Array([0xff, 0xd8, 0xff, 0xe0])], "identity.jpg", {
        type: "image/jpeg",
      }),
    ),
  );
  await assert.rejects(
    validatePrivateDocument(
      new File([new Uint8Array([0x3c, 0x73, 0x76, 0x67])], "identity.png", {
        type: "image/png",
      }),
    ),
    /content does not match/i,
  );
});
