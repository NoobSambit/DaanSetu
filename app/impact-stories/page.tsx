import Link from "next/link";

import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type ImpactStory = {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  created_at: string;
  featured_at: string | null;
  users: { name?: string } | null;
  post_likes: Array<{ count: number }>;
  post_comments: Array<{ count: number }>;
};

function StoryCard({
  story,
  featured = false,
}: {
  story: ImpactStory;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/community/${story.id}`}
      className="group block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
    >
      {story.image_url && (
        <div className="h-48 overflow-hidden bg-slate-100">
          {/* The URL is an approved Supabase Storage object, not user HTML. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={story.image_url}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <div className="p-6">
        {featured && (
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-700">
            Featured impact story
          </p>
        )}
        <h2 className="text-xl font-bold text-[#10214e] group-hover:text-blue-700">
          {story.title}
        </h2>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
          {story.content}
        </p>
        <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
          <span>{story.users?.name ?? "DaanSetu community"}</span>
          <span>{new Date(story.created_at).toLocaleDateString("en-IN")}</span>
          <span>{story.post_likes[0]?.count ?? 0} likes</span>
          <span>{story.post_comments[0]?.count ?? 0} comments</span>
        </div>
      </div>
    </Link>
  );
}

export default async function ImpactStoriesPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("posts")
    .select(
      "id, title, content, image_url, created_at, featured_at, users(name), post_likes(count), post_comments(count)",
    )
    .eq("status", "published")
    .eq("is_impact_story", true)
    .not("approved_at", "is", null)
    .is("hidden_at", null)
    .order("featured_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(24);
  const stories = (data ?? []) as unknown as ImpactStory[];
  const featuredStories = stories
    .filter((story) => story.featured_at)
    .slice(0, 3);
  const otherStories = stories.filter((story) => !story.featured_at);

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <div className="mx-auto max-w-7xl">
        <header className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-emerald-700">
            Verified community impact
          </p>
          <h1 className="mt-3 text-4xl font-bold text-[#10214e]">
            Impact stories
          </h1>
          <p className="mt-4 text-lg text-slate-600">
            Approved stories published by supporters, NGOs, and CSR teams.
          </p>
        </header>

        {error ? (
          <p
            role="alert"
            className="mx-auto mt-10 max-w-2xl rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-800"
          >
            Impact stories could not be loaded. Please try again shortly.
          </p>
        ) : stories.length === 0 ? (
          <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <h2 className="text-xl font-bold text-slate-900">
              No approved impact stories yet
            </h2>
            <p className="mt-2 text-slate-600">
              Published community posts appear here only after impact review.
            </p>
          </div>
        ) : (
          <>
            {featuredStories.length > 0 && (
              <section className="mt-12" aria-labelledby="featured-stories">
                <h2
                  id="featured-stories"
                  className="text-2xl font-bold text-[#10214e]"
                >
                  Featured stories
                </h2>
                <div className="mt-6 grid gap-6 md:grid-cols-3">
                  {featuredStories.map((story) => (
                    <StoryCard key={story.id} story={story} featured />
                  ))}
                </div>
              </section>
            )}

            {otherStories.length > 0 && (
              <section className="mt-12" aria-labelledby="all-stories">
                <h2
                  id="all-stories"
                  className="text-2xl font-bold text-[#10214e]"
                >
                  More impact stories
                </h2>
                <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {otherStories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
