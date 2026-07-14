import { notFound } from "next/navigation";

import {
  addPostCommentFormAction,
  bookmarkPostFormAction,
  reportPostFormAction,
  togglePostLikeFormAction,
} from "@/app/community/actions";
import { createClient } from "@/lib/supabase/server";

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, title, content, image_url, media, created_at, author_id, users(name), post_comments(id, user_id, content, created_at, users(name))",
    )
    .eq("id", id)
    .eq("status", "published")
    .is("hidden_at", null)
    .maybeSingle();
  if (!post) notFound();
  const [{ count: likeCount }, likedResult, bookmarkResult] = await Promise.all(
    [
      supabase
        .from("post_likes")
        .select("id", { count: "exact", head: true })
        .eq("post_id", id),
      user
        ? supabase
            .from("post_likes")
            .select("id")
            .eq("post_id", id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? supabase
            .from("post_bookmarks")
            .select("id")
            .eq("post_id", id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ],
  );
  const comments = (post.post_comments ?? []) as Array<{
    id: string;
    user_id: string;
    content: string;
    created_at: string;
    users: { name?: string } | null;
  }>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-[#10214e]">{post.title}</h1>
        <p className="mt-6 whitespace-pre-wrap text-slate-700">
          {post.content}
        </p>
        {post.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={post.title}
            className="mt-6 max-h-[32rem] w-full rounded-xl object-cover"
            src={post.image_url}
          />
        )}
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-200 pt-5">
          <p className="mr-auto text-sm text-slate-600">
            {likeCount ?? 0} {(likeCount ?? 0) === 1 ? "like" : "likes"} ·{" "}
            {comments.length} {comments.length === 1 ? "comment" : "comments"}
          </p>
          {user?.email_confirmed_at && (
            <>
              <form action={togglePostLikeFormAction}>
                <input name="postId" type="hidden" value={post.id} />
                <button className="btn btn-secondary" type="submit">
                  {likedResult.data ? "Unlike" : "Like"}
                </button>
              </form>
              <form action={bookmarkPostFormAction}>
                <input name="postId" type="hidden" value={post.id} />
                <button className="btn btn-secondary" type="submit">
                  {bookmarkResult.data ? "Remove bookmark" : "Bookmark"}
                </button>
              </form>
            </>
          )}
        </div>
        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold text-slate-900">Comments</h2>
          {user?.email_confirmed_at && (
            <form
              action={addPostCommentFormAction}
              className="mt-4 flex flex-col gap-3 sm:flex-row"
            >
              <input name="postId" type="hidden" value={post.id} />
              <input
                className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
                maxLength={2_000}
                name="content"
                placeholder="Add a respectful comment"
                required
              />
              <button className="btn btn-primary" type="submit">
                Comment
              </button>
            </form>
          )}
          <div className="mt-4 space-y-3">
            {comments.length ? (
              comments.map((comment) => (
                <div key={comment.id} className="rounded-xl bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-900">
                    {comment.users?.name ?? "Community member"}
                  </p>
                  <p className="mt-1 text-slate-700">{comment.content}</p>
                </div>
              ))
            ) : (
              <p className="text-slate-600">No comments yet.</p>
            )}
          </div>
        </section>
        {user?.email_confirmed_at && user.id !== post.author_id && (
          <details className="mt-8 border-t border-slate-200 pt-6">
            <summary className="cursor-pointer text-sm font-semibold text-red-700">
              Report this post
            </summary>
            <form
              action={reportPostFormAction}
              className="mt-4 space-y-3 rounded-xl border border-red-200 bg-red-50 p-4"
            >
              <input name="postId" type="hidden" value={post.id} />
              <select
                className="w-full rounded-lg border border-red-200 bg-white px-3 py-2"
                name="reason"
                required
              >
                <option value="spam">Spam</option>
                <option value="inappropriate">Inappropriate content</option>
                <option value="fraud">Fraud or misleading claim</option>
                <option value="harassment">Harassment</option>
                <option value="other">Other</option>
              </select>
              <textarea
                className="min-h-24 w-full rounded-lg border border-red-200 bg-white px-3 py-2"
                maxLength={1_000}
                minLength={10}
                name="description"
                placeholder="Explain what should be reviewed"
                required
              />
              <button className="btn btn-secondary" type="submit">
                Submit report
              </button>
            </form>
          </details>
        )}
      </article>
    </main>
  );
}
