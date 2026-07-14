"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { financialYearForDate } from "@/lib/domain/financial-year";
import { encryptSensitiveBytes } from "@/lib/security/encryption";
import { validateOfficialPdf } from "@/lib/storage/file-validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const metadataSchema = z.object({
  donationId: z.string().uuid(),
  financialYear: z.string().regex(/^\d{4}-\d{2}$/),
  certificateNumber: z.string().trim().min(4).max(100),
  issuedAt: z.string().date(),
});

export async function uploadOfficialForm10BEAction(formData: FormData) {
  const file = formData.get("certificate");
  if (!(file instanceof File))
    throw new Error("Official Form 10BE PDF is required");
  await validateOfficialPdf(file);
  const values = metadataSchema.parse({
    donationId: formData.get("donationId"),
    financialYear: formData.get("financialYear"),
    certificateNumber: formData.get("certificateNumber"),
    issuedAt: formData.get("issuedAt"),
  });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    throw new Error("Verified authentication is required");
  }
  const { data: ngo } = await supabase
    .from("ngos")
    .select("id, tax_exemption_80g")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!ngo?.tax_exemption_80g) {
    throw new Error("Verified 80G eligibility is required");
  }
  const { data: verification } = await supabase
    .from("ngo_verifications")
    .select("verification_status")
    .eq("ngo_id", ngo.id)
    .eq("verification_status", "verified")
    .maybeSingle();
  if (!verification) throw new Error("NGO verification is required");

  const admin = createAdminClient();
  const { data: donation } = await admin
    .from("donations")
    .select("id, ngo_id, captured_at, status, is_demo")
    .eq("id", values.donationId)
    .eq("ngo_id", ngo.id)
    .eq("is_demo", false)
    .in("status", ["captured", "partially_refunded"])
    .maybeSingle();
  if (
    !donation?.captured_at ||
    financialYearForDate(new Date(donation.captured_at)) !==
      values.financialYear
  ) {
    throw new Error("The donation is not eligible for this financial year");
  }

  const certificateId = crypto.randomUUID();
  const path = `${ngo.id}/${certificateId}.encrypted`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const encryptedBytes = encryptSensitiveBytes(
    bytes,
    `tax-certificate:${certificateId}`,
  );
  const { error: uploadError } = await admin.storage
    .from("tax-certificates")
    .upload(path, encryptedBytes, {
      contentType: "application/octet-stream",
      upsert: false,
    });
  if (uploadError)
    throw new Error("The official certificate could not be stored");

  const { error } = await admin.from("tax_certificates").insert({
    id: certificateId,
    ngo_id: ngo.id,
    donation_id: values.donationId,
    financial_year: values.financialYear,
    certificate_number: values.certificateNumber,
    storage_path: path,
    issued_at: values.issuedAt,
    uploaded_by: user.id,
    encryption_version: 1,
    encrypted_at: new Date().toISOString(),
  });
  if (error) {
    await admin.storage.from("tax-certificates").remove([path]);
    throw new Error("The official Form 10BE mapping could not be saved");
  }
  revalidatePath("/ngo/dashboard/tax");
}
