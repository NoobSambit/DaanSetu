"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { enforceActionRateLimit } from "@/lib/security/action-rate-limit";
import { createClient } from "@/lib/supabase/server";

async function verifiedUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email_confirmed_at)
    throw new Error("A verified account is required");
  return { supabase, user };
}

export async function bookmarkPostAction(postId: string) {
  const id = z.string().uuid().parse(postId);
  const { supabase, user } = await verifiedUser();
  const { data: existing } = await supabase
    .from("post_bookmarks")
    .select("id")
    .eq("post_id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing)
    await supabase.from("post_bookmarks").delete().eq("id", existing.id);
  else
    await supabase
      .from("post_bookmarks")
      .insert({ post_id: id, user_id: user.id });
  revalidatePath(`/community/${id}`);
  revalidatePath("/community");
}

export async function bookmarkPostFormAction(formData: FormData) {
  return bookmarkPostAction(z.string().parse(formData.get("postId")));
}

export async function reportPostAction(input: unknown) {
  const values = z
    .object({
      postId: z.string().uuid(),
      reason: z.enum(["spam", "inappropriate", "fraud", "harassment", "other"]),
      description: z.string().trim().min(10).max(1000),
    })
    .parse(input);
  const { supabase, user } = await verifiedUser();
  await enforceActionRateLimit({
    action: "community.report",
    maximumHits: 10,
    windowSeconds: 3_600,
  });
  const { error } = await supabase.from("content_reports").insert({
    reported_by: user.id,
    entity_type: "post",
    entity_id: values.postId,
    reason: values.reason,
    description: values.description,
  });
  if (error) throw new Error("Report could not be submitted");
}

export async function reportPostFormAction(formData: FormData) {
  await reportPostAction({
    postId: formData.get("postId"),
    reason: formData.get("reason"),
    description: formData.get("description"),
  });
  revalidatePath(`/community/${String(formData.get("postId"))}`);
}

export async function sharePostAction(postId: string) {
  const id = z.string().uuid().parse(postId);
  await verifiedUser();
  return `${process.env.NEXT_PUBLIC_APP_URL}/community/${id}`;
}

export async function publishPostAction(input: unknown) {
  const values = z
    .object({
      title: z.string().trim().min(5).max(150),
      content: z.string().trim().min(20).max(10000),
      category: z.enum(["update", "story", "announcement"]),
      media: z
        .array(
          z.object({
            path: z
              .string()
              .regex(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(?:jpg|png|webp)$/i),
            type: z.literal("image"),
          }),
        )
        .max(1)
        .default([]),
    })
    .parse(input);
  const { supabase, user } = await verifiedUser();
  await enforceActionRateLimit({
    action: "community.publish",
    maximumHits: 5,
    windowSeconds: 3_600,
  });
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  if (values.media.some((item) => !item.path.startsWith(`${user.id}/`))) {
    throw new Error("Community media ownership could not be verified");
  }
  const imageUrl = values.media[0]
    ? supabase.storage
        .from("community-media")
        .getPublicUrl(values.media[0].path).data.publicUrl
    : null;
  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    author_role: profile?.role ?? "supporter",
    title: values.title,
    content: values.content,
    category: values.category,
    image_url: imageUrl,
    media: values.media,
    status: "published",
  });
  if (error) throw new Error("Post could not be published");
  revalidatePath("/community");
}

export async function publishPostFormAction(formData: FormData) {
  await publishPostAction({
    title: formData.get("title"),
    content: formData.get("content"),
    category: formData.get("category"),
    media: [],
  });
  redirect("/community");
}

export async function togglePostLikeFormAction(formData: FormData) {
  const postId = z.string().uuid().parse(formData.get("postId"));
  const { supabase, user } = await verifiedUser();
  const { data: existing } = await supabase
    .from("post_likes")
    .select("id")
    .eq("post_id", postId)
    .eq("user_id", user.id)
    .maybeSingle();
  const { error } = existing
    ? await supabase.from("post_likes").delete().eq("id", existing.id)
    : await supabase
        .from("post_likes")
        .insert({ post_id: postId, user_id: user.id });

  if (error) throw new Error("The post reaction could not be updated");
  revalidatePath(`/community/${postId}`);
  revalidatePath("/community");
}

export async function addPostCommentFormAction(formData: FormData) {
  const values = z
    .object({
      postId: z.string().uuid(),
      content: z.string().trim().min(1).max(2_000),
    })
    .parse({
      postId: formData.get("postId"),
      content: formData.get("content"),
    });
  const { supabase, user } = await verifiedUser();
  await enforceActionRateLimit({
    action: "community.comment",
    maximumHits: 30,
    windowSeconds: 3_600,
  });
  const { error } = await supabase.from("post_comments").insert({
    post_id: values.postId,
    user_id: user.id,
    content: values.content,
  });

  if (error) throw new Error("The comment could not be published");
  revalidatePath(`/community/${values.postId}`);
  revalidatePath("/community");
}
