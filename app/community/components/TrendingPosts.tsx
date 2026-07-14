import { getTrendingPosts } from "@/lib/services/posts";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function TrendingPosts() {
  const supabase = await createClient();
  const trendingPosts = await getTrendingPosts(5, supabase);

  if (trendingPosts.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-2xl">🔥</span>
        <h2 className="text-xl font-bold text-gray-900">Trending Now</h2>
      </div>

      <div className="space-y-3">
        {trendingPosts.map((post, index) => (
          <Link
            key={post.id}
            href={`/community/${post.id}`}
            className="block p-3 bg-white rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <span className="text-lg font-bold text-orange-500">
                #{index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  {post.title}
                </h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                  <span>❤️ {post.like_count}</span>
                  <span>💬 {post.comment_count}</span>
                  <span>👁️ {post.view_count || 0}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
