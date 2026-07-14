"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { enforceActionRateLimit } from "@/lib/security/action-rate-limit";
import { createClient } from "@/lib/supabase/server";

const followSchema = z.object({
  targetId: z.string().uuid(),
  targetType: z.enum(["user", "ngo", "corporate"]),
});

export async function toggleFollowAction(input: unknown) {
  const values = followSchema.parse(input);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at) {
    throw new Error("A verified account is required");
  }
  if (values.targetType === "user" && values.targetId === user.id) {
    throw new Error("You cannot follow your own account");
  }
  await enforceActionRateLimit({
    action: "social.follow.toggle",
    maximumHits: 60,
    windowSeconds: 3_600,
  });

  const targetQuery =
    values.targetType === "ngo"
      ? supabase
          .from("ngos")
          .select("id")
          .eq("id", values.targetId)
          .eq("profile_status", "published")
      : values.targetType === "corporate"
        ? supabase
            .from("corporate_profiles")
            .select("id")
            .eq("id", values.targetId)
        : supabase.from("users").select("id").eq("id", values.targetId);
  const { data: target } = await targetQuery.maybeSingle();
  if (!target) throw new Error("The account is not available to follow");

  const { data: existing } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", values.targetId)
    .eq("following_type", values.targetType)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("follows").delete().eq("id", existing.id)
    : await supabase.from("follows").insert({
        follower_id: user.id,
        following_id: values.targetId,
        following_type: values.targetType,
      });
  if (error) throw new Error("The follow preference could not be updated");

  revalidatePath(`/ngos/${values.targetId}`);
  revalidatePath(`/profile/${values.targetId}`);
  return { isFollowing: !existing };
}
