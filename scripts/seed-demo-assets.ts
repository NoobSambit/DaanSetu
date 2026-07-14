import { createHash } from "node:crypto";

import { createClient } from "@supabase/supabase-js";
import sharp from "sharp";

import { encryptSensitiveBytes } from "../lib/security/encryption.ts";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.",
  );
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const palette = [
  { background: "#dbeafe", foreground: "#1e3a8a", accent: "#2563eb" },
  { background: "#d1fae5", foreground: "#064e3b", accent: "#059669" },
  { background: "#fef3c7", foreground: "#78350f", accent: "#d97706" },
  { background: "#ede9fe", foreground: "#4c1d95", accent: "#7c3aed" },
  { background: "#ffe4e6", foreground: "#881337", accent: "#e11d48" },
  { background: "#cffafe", foreground: "#164e63", accent: "#0891b2" },
];

function deterministicUuid(seed: string) {
  const value = createHash("md5").update(seed).digest("hex");
  return [
    value.slice(0, 8),
    value.slice(8, 12),
    value.slice(12, 16),
    value.slice(16, 20),
    value.slice(20),
  ].join("-");
}

function escapeXml(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}

async function illustration(
  width: number,
  height: number,
  title: string,
  subtitle: string,
  colors: (typeof palette)[number],
) {
  const fontSize = Math.max(32, Math.round(width / 18));
  const subtitleSize = Math.max(18, Math.round(width / 38));
  const svg = `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${width}" height="${height}" fill="${colors.background}" />
      <circle cx="${Math.round(width * 0.82)}" cy="${Math.round(height * 0.2)}" r="${Math.round(height * 0.32)}" fill="${colors.accent}" opacity="0.16" />
      <circle cx="${Math.round(width * 0.15)}" cy="${Math.round(height * 0.9)}" r="${Math.round(height * 0.38)}" fill="${colors.accent}" opacity="0.12" />
      <rect x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.16)}" width="${Math.round(width * 0.1)}" height="${Math.round(width * 0.1)}" rx="${Math.round(width * 0.02)}" fill="${colors.accent}" />
      <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.58)}" fill="${colors.foreground}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700">${escapeXml(title)}</text>
      <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.69)}" fill="${colors.foreground}" font-family="Arial, sans-serif" font-size="${subtitleSize}" opacity="0.78">${escapeXml(subtitle)}</text>
      <text x="${Math.round(width * 0.08)}" y="${Math.round(height * 0.86)}" fill="${colors.foreground}" font-family="Arial, sans-serif" font-size="${Math.max(14, subtitleSize - 3)}" opacity="0.58">FICTIONAL DEMO ASSET</text>
    </svg>
  `;

  return sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toBuffer();
}

function demoPdf(title: string) {
  return Buffer.from(
    [
      "%PDF-1.4",
      "% DaanSetu fictional development document",
      `1 0 obj << /Type /Catalog /Pages 2 0 R /Title (${title}) >> endobj`,
      "2 0 obj << /Type /Pages /Count 0 /Kids [] >> endobj",
      "trailer << /Root 1 0 R >>",
      "%%EOF",
    ].join("\n"),
    "utf8",
  );
}

async function upload(
  bucket: string,
  path: string,
  body: Uint8Array,
  contentType: string,
) {
  const { error } = await supabase.storage.from(bucket).upload(path, body, {
    cacheControl: "31536000",
    contentType,
    upsert: true,
  });

  if (error) {
    throw new Error(`Could not seed ${bucket}/${path}: ${error.message}`);
  }
}

async function seedPublicImages() {
  for (let index = 1; index <= palette.length; index += 1) {
    const colors = palette[index - 1];
    const logo = await illustration(
      512,
      512,
      `NGO ${index}`,
      "DaanSetu",
      colors,
    );
    const cover = await illustration(
      1200,
      675,
      `Community Impact ${index}`,
      "Transparent fictional outcomes for UI development",
      colors,
    );
    const community = await illustration(
      1200,
      675,
      `Impact Story ${index}`,
      "Community, volunteering, and accountable giving",
      colors,
    );

    await Promise.all([
      upload("ngos", `demo/logos/logo-${index}.png`, logo, "image/png"),
      upload("ngos", `demo/covers/cover-${index}.png`, cover, "image/png"),
      upload(
        "community-media",
        `demo/posts/story-${index}.png`,
        community,
        "image/png",
      ),
    ]);
  }
}

async function seedVerificationDocuments() {
  for (let index = 1; index <= 24; index += 1) {
    const documentId = deterministicUuid(`ngo-document:${index}`);
    const encrypted = encryptSensitiveBytes(
      demoPdf(`NGO verification document ${index}`),
      `ngo-verification-document:${documentId}`,
    );

    await upload(
      "ngo-verification",
      `demo/verification/document-${String(index).padStart(3, "0")}.encrypted`,
      encrypted,
      "application/pdf",
    );
  }
}

async function seedTaxCertificates() {
  for (let index = 1; index <= 48; index += 1) {
    const certificateId = deterministicUuid(`tax-certificate:${index}`);
    const encrypted = encryptSensitiveBytes(
      demoPdf(`Official Form 10BE mapping ${index}`),
      `tax-certificate:${certificateId}`,
    );

    await upload(
      "tax-certificates",
      `demo/tax/form-10be-${String(index).padStart(3, "0")}.encrypted`,
      encrypted,
      "application/pdf",
    );
  }
}

async function seedCampaignEvidence() {
  for (let index = 1; index <= 96; index += 1) {
    const campaignId = deterministicUuid(`ngo-campaign:${index}`);
    const evidenceId = deterministicUuid(`ngo-campaign-evidence:${index}`);
    const encrypted = encryptSensitiveBytes(
      demoPdf(`NGO campaign project plan ${index}`),
      `campaign-evidence:${campaignId}:${evidenceId}`,
    );

    await upload(
      "campaign-evidence",
      `demo/${campaignId}/${evidenceId}.encrypted`,
      encrypted,
      "application/octet-stream",
    );
  }

  for (let index = 1; index <= 20; index += 1) {
    const campaignId = deterministicUuid(`supporter-campaign:${index}`);
    const consentId = deterministicUuid(`supporter-campaign-consent:${index}`);
    const estimateId = deterministicUuid(
      `supporter-campaign-estimate:${index}`,
    );

    await Promise.all([
      upload(
        "campaign-evidence",
        `demo/${campaignId}/${consentId}.encrypted`,
        encryptSensitiveBytes(
          demoPdf(`Beneficiary consent ${index}`),
          `campaign-evidence:${campaignId}:${consentId}`,
        ),
        "application/octet-stream",
      ),
      upload(
        "campaign-evidence",
        `demo/${campaignId}/${estimateId}.encrypted`,
        encryptSensitiveBytes(
          demoPdf(`Cost estimate ${index}`),
          `campaign-evidence:${campaignId}:${estimateId}`,
        ),
        "application/octet-stream",
      ),
    ]);
  }
}

async function main() {
  await seedPublicImages();
  await seedVerificationDocuments();
  await seedTaxCertificates();
  await seedCampaignEvidence();

  console.log(
    "Seeded 18 shared public images and 208 encrypted demo documents.",
  );
}

await main();
