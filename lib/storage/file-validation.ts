const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);
const JPEG_SIGNATURE = new Uint8Array([0xff, 0xd8, 0xff]);
const PNG_SIGNATURE = new Uint8Array([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);
const WEBP_RIFF_SIGNATURE = new Uint8Array([0x52, 0x49, 0x46, 0x46]);
const WEBP_SIGNATURE = new Uint8Array([0x57, 0x45, 0x42, 0x50]);

function startsWith(bytes: Uint8Array, signature: Uint8Array) {
  return (
    bytes.length >= signature.length &&
    signature.every((byte, index) => bytes[index] === byte)
  );
}

export async function validatePublicImage(
  file: File,
  maxBytes = 5 * 1024 * 1024,
) {
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error("Image size is invalid");
  }
  const extension = file.name.toLowerCase().split(".").pop();
  const header = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const validJpeg =
    file.type === "image/jpeg" &&
    (extension === "jpg" || extension === "jpeg") &&
    startsWith(header, JPEG_SIGNATURE);
  const validPng =
    file.type === "image/png" &&
    extension === "png" &&
    startsWith(header, PNG_SIGNATURE);
  const validWebp =
    file.type === "image/webp" &&
    extension === "webp" &&
    startsWith(header, WEBP_RIFF_SIGNATURE) &&
    startsWith(header.slice(8), WEBP_SIGNATURE);
  if (!validJpeg && !validPng && !validWebp) {
    throw new Error("Image extension, MIME type, and content must match");
  }
}

export async function validatePrivateDocument(
  file: File,
  maxBytes = 10 * 1024 * 1024,
) {
  if (file.size <= 0 || file.size > maxBytes) {
    throw new Error("Document size is invalid");
  }
  const extension = file.name.toLowerCase().split(".").pop();
  const expected =
    file.type === "application/pdf" && extension === "pdf"
      ? PDF_SIGNATURE
      : file.type === "image/jpeg" &&
          (extension === "jpg" || extension === "jpeg")
        ? JPEG_SIGNATURE
        : file.type === "image/png" && extension === "png"
          ? PNG_SIGNATURE
          : null;
  if (!expected) {
    throw new Error("Document extension and MIME type do not match");
  }
  const bytes = new Uint8Array(
    await file.slice(0, expected.length).arrayBuffer(),
  );
  if (!startsWith(bytes, expected)) {
    throw new Error("Document content does not match its declared type");
  }
}

export async function validateOfficialPdf(
  file: File,
  maxBytes = 10 * 1024 * 1024,
) {
  if (file.size <= 0 || file.size > maxBytes)
    throw new Error("PDF size is invalid");
  if (
    file.type !== "application/pdf" ||
    !file.name.toLowerCase().endsWith(".pdf")
  ) {
    throw new Error("The file extension and MIME type must both be PDF");
  }
  const signature = new Uint8Array(
    await file.slice(0, PDF_SIGNATURE.length).arrayBuffer(),
  );
  if (!startsWith(signature, PDF_SIGNATURE)) {
    throw new Error("The uploaded file is not a valid PDF");
  }
}
