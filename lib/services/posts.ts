import { getBrowserClient } from "@/lib/supabase";
import type {
  Post,
  PostAuthorRole,
  PostCategory,
  PostComment,
} from "@/lib/types/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";

export interface PostWithAuthor extends Post {
  author: {
    id: string;
    name: string;
    role: string;
  };
  like_count: number;
  comment_count: number;
  user_has_liked?: boolean;
}

export interface PostCommentWithUser extends PostComment {
  user: {
    id: string;
    name: string;
  };
}

export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  update: "Update",
  story: "Success Story",
  announcement: "Announcement",
};

function client(supabaseClient?: SupabaseClient) {
  return supabaseClient ?? getBrowserClient();
}

async function enrichPosts(
  posts: Array<
    Post & { author: PostWithAuthor["author"] | PostWithAuthor["author"][] }
  >,
  userId: string | undefined,
  supabase: SupabaseClient,
): Promise<PostWithAuthor[]> {
  if (posts.length === 0) return [];
  const ids = posts.map((post) => post.id);
  const [likesResult, commentsResult, ownLikesResult] = await Promise.all([
    supabase.from("post_likes").select("post_id").in("post_id", ids),
    supabase.from("post_comments").select("post_id").in("post_id", ids),
    userId
      ? supabase
          .from("post_likes")
          .select("post_id")
          .eq("user_id", userId)
          .in("post_id", ids)
      : Promise.resolve({ data: [] as Array<{ post_id: string }> }),
  ]);
  const likeCounts = new Map<string, number>();
  const commentCounts = new Map<string, number>();
  const ownLikes = new Set(
    (ownLikesResult.data ?? []).map((row) => row.post_id),
  );
  for (const row of likesResult.data ?? []) {
    likeCounts.set(row.post_id, (likeCounts.get(row.post_id) ?? 0) + 1);
  }
  for (const row of commentsResult.data ?? []) {
    commentCounts.set(row.post_id, (commentCounts.get(row.post_id) ?? 0) + 1);
  }

  return posts.map((post) => ({
    ...post,
    author: Array.isArray(post.author) ? post.author[0] : post.author,
    like_count: likeCounts.get(post.id) ?? 0,
    comment_count: commentCounts.get(post.id) ?? 0,
    user_has_liked: ownLikes.has(post.id),
  }));
}

export async function getPosts(
  userId?: string,
  supabaseClient?: SupabaseClient,
): Promise<PostWithAuthor[]> {
  const supabase = client(supabaseClient);
  const { data, error } = await supabase
    .from("posts")
    .select("*, author:users!posts_author_id_fkey(id, name, role)")
    .eq("status", "published")
    .is("hidden_at", null)
    .order("created_at", { ascending: false });
  if (error) throw new Error("Community posts could not be loaded");
  return enrichPosts(data as never[], userId, supabase);
}

export async function getPostComments(
  postId: string,
  supabaseClient?: SupabaseClient,
): Promise<PostCommentWithUser[]> {
  const { data, error } = await client(supabaseClient)
    .from("post_comments")
    .select("*, user:users!post_comments_user_id_fkey(id, name)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw new Error("Post comments could not be loaded");
  return (data ?? []).map((comment) => ({
    ...comment,
    user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
  })) as PostCommentWithUser[];
}

export async function getTrendingPosts(
  limit = 10,
  supabaseClient?: SupabaseClient,
): Promise<PostWithAuthor[]> {
  const supabase = client(supabaseClient);
  const boundedLimit = Math.max(1, Math.min(limit, 50));
  const { data: ranking, error: rankingError } = await supabase.rpc(
    "get_trending_posts",
    { limit_count: boundedLimit },
  );
  if (rankingError || !ranking?.length) return [];

  const order = new Map<string, number>(
    ranking.map(
      (entry: { post_id: string }, index: number): [string, number] => [
        entry.post_id,
        index,
      ],
    ),
  );
  const { data, error } = await supabase
    .from("posts")
    .select("*, author:users!posts_author_id_fkey(id, name, role)")
    .in(
      "id",
      ranking.map((entry: { post_id: string }) => entry.post_id),
    )
    .eq("status", "published")
    .is("hidden_at", null);
  if (error) return [];
  const enriched = await enrichPosts(data as never[], undefined, supabase);
  return enriched.sort(
    (left, right) =>
      (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
      (order.get(right.id) ?? Number.MAX_SAFE_INTEGER),
  );
}

export async function getPostsFiltered(
  userId?: string,
  filters?: {
    category?: PostCategory;
    authorRole?: PostAuthorRole;
    search?: string;
    featured?: boolean;
    limit?: number;
  },
  supabaseClient?: SupabaseClient,
): Promise<PostWithAuthor[]> {
  const supabase = client(supabaseClient);
  let query = supabase
    .from("posts")
    .select("*, author:users!posts_author_id_fkey(id, name, role)")
    .eq("status", "published")
    .is("hidden_at", null);

  if (filters?.category) query = query.eq("category", filters.category);
  if (filters?.authorRole) query = query.eq("author_role", filters.authorRole);
  if (filters?.featured !== undefined) {
    query = query.eq("is_featured", filters.featured);
  }
  if (filters?.search) {
    const safeSearch = filters.search.replaceAll(/[%,()]/g, " ").trim();
    if (safeSearch) {
      query = query.or(
        `title.ilike.%${safeSearch}%,content.ilike.%${safeSearch}%`,
      );
    }
  }

  query = query.order("created_at", { ascending: false });
  if (filters?.limit) query = query.limit(Math.min(filters.limit, 100));
  const { data, error } = await query;
  if (error) return [];
  return enrichPosts(data as never[], userId, supabase);
}
