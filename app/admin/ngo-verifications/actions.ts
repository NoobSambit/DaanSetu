"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  verificationId: z.string().uuid(),
  decision: z.enum(["changes_requested", "verified", "rejected"]),
  notes: z.string().trim().max(1_000),
});

export async function reviewNgoVerificationAction(formData: FormData) {
  const values = reviewSchema.parse({
    verificationId: formData.get("verificationId"),
    decision: formData.get("decision"),
    notes: formData.get("notes"),
  });
  if (values.decision !== "verified" && values.notes.length < 10) {
    throw new Error("Provide a clear review note for this decision");
  }

  await requireAdmin("/admin/ngo-verifications");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("review_ngo_verification", {
    verification_uuid: values.verificationId,
    next_status: values.decision,
    decision_note: values.notes,
  });

  if (error || !data) {
    throw new Error("The verification decision could not be recorded");
  }

  revalidatePath("/admin/ngo-verifications");
  revalidatePath(`/ngos/${data.ngo_id}`);
  revalidatePath("/ngo/profile");
  revalidatePath("/ngo/dashboard");
}
