"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireAdmin } from "@/lib/auth/require-admin";
import { createClient } from "@/lib/supabase/server";

const moderationSchema = z.object({
  reportId: z.string().uuid(),
  action: z.enum(["hide", "restore", "dismiss"]),
  reason: z.string().trim().min(10).max(1_000),
});

export async function moderateContentFormAction(formData: FormData) {
  const values = moderationSchema.parse({
    reportId: formData.get("reportId"),
    action: formData.get("action"),
    reason: formData.get("reason"),
  });
  await requireAdmin("/admin/moderation");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("moderate_reported_content", {
    report_uuid: values.reportId,
    moderation_action: values.action,
    decision_reason: values.reason,
  });

  if (error || !data) {
    throw new Error("The moderation decision could not be recorded");
  }

  revalidatePath("/admin/moderation");
  revalidatePath("/community");
}

const storyReviewSchema = z.object({
  postId: z.string().uuid(),
  feature: z.enum(["true", "false"]),
  reason: z.string().trim().min(10).max(1_000),
});

export async function reviewImpactStoryFormAction(formData: FormData) {
  const values = storyReviewSchema.parse({
    postId: formData.get("postId"),
    feature: formData.get("feature"),
    reason: formData.get("reason"),
  });
  await requireAdmin("/admin/moderation");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("review_impact_story", {
    post_uuid: values.postId,
    should_feature: values.feature === "true",
    decision_reason: values.reason,
  });

  if (error || !data) {
    throw new Error("The impact-story decision could not be recorded");
  }

  revalidatePath("/admin/moderation");
  revalidatePath("/impact-stories");
  revalidatePath("/");
  revalidatePath(`/community/${values.postId}`);
}
