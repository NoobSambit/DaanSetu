import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getPosts } from '@/lib/services/posts'
import PostFeed from './components/PostFeed'
import CreatePostButton from './components/CreatePostButton'

export const dynamic = 'force-dynamic'

export default async function CommunityPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = userData?.role || 'user'
  const canCreatePost = ['ngo', 'corporate', 'admin'].includes(userRole)

  // Get all posts
  const posts = await getPosts(user.id)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Community Feed</h1>
          <p className="text-gray-600">
            Stay updated with the latest stories, announcements, and impact from our community
          </p>
        </div>

        {/* Create Post Button (for eligible users) */}
        {canCreatePost && (
          <div className="mb-6">
            <CreatePostButton />
          </div>
        )}

        {/* Post Feed */}
        <PostFeed initialPosts={posts} userId={user.id} />
      </div>
    </div>
  )
}
