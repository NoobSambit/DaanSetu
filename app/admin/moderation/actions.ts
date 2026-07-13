"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const moderationSchema = z.object({
  reviewId: z.string().uuid(),
  reportId: z.string().uuid(),
  action: z.enum(["hide", "restore", "dismiss"]),
  reason: z.string().trim().min(10).max(1000),
});

export async function moderateReviewAction(input: unknown) {
  const values = moderationSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") throw new Error("Admin access required");

  const hiddenAt = values.action === "hide" ? new Date().toISOString() : null;
  if (values.action !== "dismiss") {
    const { error } = await supabase
      .from("ngo_reviews")
      .update({
        hidden_at: hiddenAt,
        hidden_reason: values.reason,
        moderated_by: user.id,
      })
      .eq("id", values.reviewId);
    if (error) throw new Error("The review could not be moderated");
  }

  const { error: auditError } = await supabase
    .from("moderation_actions")
    .insert({
      report_id: values.reportId,
      moderator_id: user.id,
      entity_type: "ngo_review",
      entity_id: values.reviewId,
      action: values.action,
      reason: values.reason,
    });
  if (auditError)
    throw new Error("The moderation audit record could not be saved");

  await supabase
    .from("content_reports")
    .update({
      status: values.action === "dismiss" ? "dismissed" : "resolved",
      reviewed_by: user.id,
      resolution_notes: values.reason,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", values.reportId);
  revalidatePath("/admin/moderation");
}
