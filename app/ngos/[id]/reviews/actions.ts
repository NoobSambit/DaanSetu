"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

const reviewSchema = z.object({
  ngoId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().trim().min(20).max(2000),
});

export async function submitNgoReviewAction(input: unknown) {
  const values = reviewSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email_confirmed_at)
    throw new Error("A verified account is required");

  const { data: eligible } = await supabase.rpc("can_review_ngo", {
    target_ngo_id: values.ngoId,
  });

  if (!eligible) {
    throw new Error(
      "A captured donation or approved volunteer service is required",
    );
  }

  const { error } = await supabase.from("ngo_reviews").insert({
    ngo_id: values.ngoId,
    user_id: user.id,
    rating: values.rating,
    review_text: values.reviewText,
    is_verified_donor: true,
  });

  if (error?.code === "23505")
    throw new Error("You have already reviewed this NGO");
  if (error) throw new Error("Your review could not be submitted");
  revalidatePath(`/ngos/${values.ngoId}`);
}

export async function reportNgoReviewAction(input: unknown) {
  const values = z
    .object({
      reviewId: z.string().uuid(),
      reason: z.string().trim().min(10).max(500),
    })
    .parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Authentication required");

  const { error } = await supabase.from("content_reports").insert({
    reported_by: user.id,
    entity_type: "ngo_review",
    entity_id: values.reviewId,
    reason: "other",
    description: values.reason,
  });
  if (error) throw new Error("The report could not be submitted");
}
