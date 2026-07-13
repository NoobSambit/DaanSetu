import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPosts } from "@/lib/services/posts";
import EnhancedPostFeed from "./components/EnhancedPostFeed";
import TrendingPosts from "./components/TrendingPosts";
import CreatePostButton from "./components/CreatePostButton";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CommunityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  // Get user role
  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = userData?.role || "supporter";
  const canCreatePost = Boolean(user.email_confirmed_at);

  // Get all posts
  const posts = await getPosts(user.id);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Community Feed
          </h1>
          <p className="text-gray-600">
            Stay updated with the latest stories, announcements, and impact from
            our community
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Feed Column */}
          <div className="lg:col-span-2">
            {/* Create Post Button (for eligible users) */}
            {canCreatePost && (
              <div className="mb-6">
                <CreatePostButton />
              </div>
            )}

            {/* Post Feed with Filters */}
            <EnhancedPostFeed initialPosts={posts} userId={user.id} />
          </div>

          {/* Sidebar Column */}
          <div className="lg:col-span-1">
            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link
                  href="/impact-stories"
                  className="block p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✨</span>
                    <span className="font-semibold text-gray-900">
                      Impact Stories
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Featured success stories
                  </p>
                </Link>

                <Link
                  href="/dashboard/bookmarks"
                  className="block p-3 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🔖</span>
                    <span className="font-semibold text-gray-900">
                      Saved Posts
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Your bookmarked content
                  </p>
                </Link>

                <Link
                  href="/dashboard/activity"
                  className="block p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">📊</span>
                    <span className="font-semibold text-gray-900">
                      Your Activity
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    View your timeline
                  </p>
                </Link>
              </div>
            </div>

            {/* Trending Posts */}
            <TrendingPosts />
          </div>
        </div>
      </div>
    </div>
  );
}
