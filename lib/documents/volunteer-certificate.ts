export type VolunteerCertificateDocument = {
  certificateNumber: string;
  volunteerName: string;
  ngoName: string;
  opportunityTitle: string;
  hoursCompleted: number;
  issueDate: string;
};

function escapePdfText(value: string) {
  return value
    .normalize("NFKD")
    .replaceAll(/[^\x20-\x7E]/g, "")
    .replaceAll("\\", "\\\\")
    .replaceAll("(", "\\(")
    .replaceAll(")", "\\)");
}

function textLine(text: string, x: number, y: number, size: number) {
  return `BT /F1 ${size} Tf ${x} ${y} Td (${escapePdfText(text)}) Tj ET`;
}

export function createVolunteerCertificatePdf(
  certificate: VolunteerCertificateDocument,
) {
  const content = [
    "0.08 0.13 0.31 rg 0 0 842 595 re f",
    "1 1 1 rg 36 36 770 523 re f",
    "0.08 0.13 0.31 rg",
    textLine("DAANSETU", 355, 500, 22),
    textLine("CERTIFICATE OF VOLUNTEER SERVICE", 218, 450, 24),
    textLine("This certificate recognizes", 330, 400, 14),
    textLine(certificate.volunteerName, 300, 355, 28),
    textLine(
      `for ${certificate.hoursCompleted.toFixed(2)} approved service hours with`,
      270,
      315,
      14,
    ),
    textLine(certificate.ngoName, 300, 275, 20),
    textLine(`Opportunity: ${certificate.opportunityTitle}`, 225, 235, 14),
    textLine(`Issued: ${certificate.issueDate}`, 120, 155, 12),
    textLine(`Certificate: ${certificate.certificateNumber}`, 470, 155, 12),
    textLine("Verify against the DaanSetu platform record.", 290, 100, 10),
  ].join("\n");

  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  for (const offset of offsets.slice(1)) {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
  pdf += `startxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}
