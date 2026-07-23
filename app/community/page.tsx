import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPosts } from "@/lib/services/posts";
import { Activity, Bookmark, Sparkles } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/ui/PagePrimitives";
import EnhancedPostFeed from "./components/EnhancedPostFeed";
import TrendingPosts from "./components/TrendingPosts";
import CreatePostButton from "./components/CreatePostButton";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in?next=/community");
  }

  const canCreatePost = Boolean(user.email_confirmed_at);
  const posts = await getPosts(user.id, supabase);

  return (
    <main className="page-frame">
      <div className="page-content">
        <PageHeader
          eyebrow="DaanSetu community"
          title="Community feed"
          description="Follow verified updates, stories, and announcements from people and organizations creating impact."
          actions={canCreatePost ? <CreatePostButton /> : undefined}
        />

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div>
            <EnhancedPostFeed initialPosts={posts} />
          </div>

          <aside className="space-y-6">
            <section className="panel p-5">
              <h2 className="text-base font-bold text-slate-900">
                Your community space
              </h2>
              <div className="space-y-3">
                <Link
                  href="/impact-stories"
                  className="mt-4 block rounded-lg border border-slate-200 bg-slate-50 p-3.5 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles
                      className="h-4 w-4 text-blue-700"
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-slate-900">
                      Impact Stories
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Featured success stories
                  </p>
                </Link>

                <Link
                  href="/dashboard/bookmarks"
                  className="block rounded-lg border border-slate-200 bg-slate-50 p-3.5 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-center gap-2">
                    <Bookmark
                      className="h-4 w-4 text-blue-700"
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-slate-900">
                      Saved Posts
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    Your bookmarked content
                  </p>
                </Link>

                <Link
                  href="/dashboard/activity"
                  className="block rounded-lg border border-slate-200 bg-slate-50 p-3.5 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <div className="flex items-center gap-2">
                    <Activity
                      className="h-4 w-4 text-blue-700"
                      aria-hidden="true"
                    />
                    <span className="font-semibold text-slate-900">
                      Your Activity
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">
                    View your timeline
                  </p>
                </Link>
              </div>
            </section>

            <TrendingPosts />
          </aside>
        </div>
      </div>
    </main>
  );
}
