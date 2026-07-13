"use server";

import { z } from "zod";

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
  const { error } = await supabase.from("content_reports").insert({
    reported_by: user.id,
    entity_type: "post",
    entity_id: values.postId,
    reason: values.reason,
    description: values.description,
  });
  if (error) throw new Error("Report could not be submitted");
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
            path: z.string().min(1),
            type: z.enum(["image", "video"]),
          }),
        )
        .max(6)
        .default([]),
    })
    .parse(input);
  const { supabase, user } = await verifiedUser();
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();
  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    author_role: profile?.role ?? "supporter",
    title: values.title,
    content: values.content,
    category: values.category,
    media: values.media,
    status: "published",
  });
  if (error) throw new Error("Post could not be published");
}
