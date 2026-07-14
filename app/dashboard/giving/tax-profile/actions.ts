"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { encryptSensitiveText } from "@/lib/security/encryption";
import { createClient } from "@/lib/supabase/server";

const taxProfileSchema = z
  .object({
    idCode: z.enum(["PAN", "AADHAAR", "PASSPORT", "VOTER_ID", "FOREIGN_TIN"]),
    identifier: z.string().trim().min(4).max(100),
    address: z.string().trim().min(10).max(1000),
    consent: z.literal("on"),
  })
  .superRefine((value, context) => {
    const normalized = value.identifier.toUpperCase().replaceAll(" ", "");
    if (value.idCode === "PAN" && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(normalized)) {
      context.addIssue({
        code: "custom",
        path: ["identifier"],
        message: "PAN format is invalid",
      });
    }
    if (value.idCode === "AADHAAR" && !/^[0-9]{12}$/.test(normalized)) {
      context.addIssue({
        code: "custom",
        path: ["identifier"],
        message: "Aadhaar format is invalid",
      });
    }
  });

export async function saveTaxProfileAction(formData: FormData) {
  // Next.js server actions validate their request origin before invocation.
  const values = taxProfileSchema.parse({
    idCode: formData.get("idCode"),
    identifier: formData.get("identifier"),
    address: formData.get("address"),
    consent: formData.get("consent"),
  });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email_confirmed_at) {
    throw new Error("Verified authentication is required");
  }

  const identifier = values.identifier.toUpperCase().replaceAll(" ", "");
  const { error } = await supabase.from("donor_tax_profiles").upsert(
    {
      user_id: user.id,
      id_code: values.idCode,
      identifier_ciphertext: encryptSensitiveText(
        identifier,
        `tax-profile:${user.id}:identifier`,
      ),
      address_ciphertext: encryptSensitiveText(
        values.address,
        `tax-profile:${user.id}:address`,
      ),
      consented_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (error) {
    throw new Error("Tax details could not be saved");
  }
  revalidatePath("/dashboard/giving");
}
