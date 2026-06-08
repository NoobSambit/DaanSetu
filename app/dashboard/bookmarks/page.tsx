import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getUserBookmarks } from '@/lib/services/bookmarks'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function BookmarksPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  const bookmarks = await getUserBookmarks(user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Saved Posts</h1>
          <p className="text-gray-600">
            Posts you&apos;ve bookmarked for later reading
          </p>
        </div>

        {/* Bookmarked Posts */}
        {bookmarks.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4">🔖</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Saved Posts</h3>
            <p className="text-gray-600 mb-6">
              Start bookmarking posts to save them for later!
            </p>
            <Link
              href="/community"
              className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Browse Community Feed
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Link href={`/community/posts/${bookmark.post.id}`}>
                      <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 mb-2">
                        {bookmark.post.title}
                      </h3>
                    </Link>

                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {bookmark.post.content}
                    </p>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span className="capitalize bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {bookmark.post.category}
                      </span>
                      <span>
                        Saved on {new Date(bookmark.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {bookmark.post.image_url && (
                    <div className="flex-shrink-0 w-24 h-24 bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={bookmark.post.image_url}
                        alt={bookmark.post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
