const PDF_SIGNATURE = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

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
  if (
    signature.length !== PDF_SIGNATURE.length ||
    !signature.every((byte, index) => byte === PDF_SIGNATURE[index])
  ) {
    throw new Error("The uploaded file is not a valid PDF");
  }
}
