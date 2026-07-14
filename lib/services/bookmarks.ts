import type { SupabaseClient } from "@supabase/supabase-js";

import { getBrowserClient } from "@/lib/supabase";

export interface PostBookmark {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
}

export interface BookmarkWithPost extends PostBookmark {
  post: {
    id: string;
    author_id: string;
    author_role: string;
    title: string;
    content: string;
    image_url: string | null;
    category: string;
    created_at: string;
    updated_at: string;
  };
}

function client(supabaseClient?: SupabaseClient) {
  return supabaseClient ?? getBrowserClient();
}

export async function hasBookmarked(
  userId: string,
  postId: string,
  supabaseClient?: SupabaseClient,
): Promise<boolean> {
  const { data, error } = await client(supabaseClient)
    .from("post_bookmarks")
    .select("id")
    .eq("user_id", userId)
    .eq("post_id", postId)
    .maybeSingle();

  return !error && Boolean(data);
}

export async function getUserBookmarks(
  userId: string,
  supabaseClient?: SupabaseClient,
): Promise<BookmarkWithPost[]> {
  const { data, error } = await client(supabaseClient)
    .from("post_bookmarks")
    .select(
      "id, user_id, post_id, created_at, post:posts(id, author_id, author_role, title, content, image_url, category, created_at, updated_at)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((bookmark) => ({
    ...bookmark,
    post: Array.isArray(bookmark.post) ? bookmark.post[0] : bookmark.post,
  })) as BookmarkWithPost[];
}
