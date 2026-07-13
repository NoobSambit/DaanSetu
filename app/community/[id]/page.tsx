import { notFound } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function CommunityPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: post } = await supabase
    .from("posts")
    .select(
      "id, title, content, media, created_at, author_id, users(name), post_comments(id, content, created_at, users(name))",
    )
    .eq("id", id)
    .eq("status", "published")
    .is("hidden_at", null)
    .maybeSingle();
  if (!post) notFound();
  const comments = (post.post_comments ?? []) as Array<{
    id: string;
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
        <section className="mt-10 border-t border-slate-200 pt-8">
          <h2 className="text-xl font-bold text-slate-900">Comments</h2>
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
      </article>
    </main>
  );
}
