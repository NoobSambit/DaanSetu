import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { getUserProfile, getUserStats } from '@/lib/services/user-profiles'
import { getUserBadges } from '@/lib/services/badges'
import { getPostsFiltered } from '@/lib/services/posts'
import Image from 'next/image'
import Link from 'next/link'
import FollowButton from './components/FollowButton'

export const dynamic = 'force-dynamic'

interface Props {
  params: Promise<{ userId: string }>
}

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params
  const supabase = await createClient()

  const { data: { user: currentUser } } = await supabase.auth.getUser()

  if (!currentUser) {
    redirect('/sign-in')
  }

  // Get user data
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (userError || !userData) {
    notFound()
  }

  // Get profile (may not exist)
  const profile = await getUserProfile(userId)

  // Get stats
  const stats = await getUserStats(userId)

  // Get badges
  const badges = await getUserBadges(userId)

  // Get user's posts
  const userPosts = await getPostsFiltered(currentUser.id, { limit: 10 })
  const filteredPosts = userPosts.filter(p => p.author_id === userId)

  const isOwnProfile = currentUser.id === userId

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {profile?.avatar_url ? (
                <Image
                  src={profile.avatar_url}
                  alt={userData.name}
                  width={120}
                  height={120}
                  className="rounded-full"
                />
              ) : (
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white text-4xl font-bold">
                  {userData.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{userData.name}</h1>
                {isOwnProfile ? (
                  <Link
                    href="/dashboard/profile/edit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Edit Profile
                  </Link>
                ) : (
                  <FollowButton
                    currentUserId={currentUser.id}
                    targetUserId={userId}
                    targetType="user"
                  />
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <span className="capitalize bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  {userData.role}
                </span>
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    📍 {profile.location}
                  </span>
                )}
              </div>

              {profile?.bio && (
                <p className="text-gray-700 mb-4">{profile.bio}</p>
              )}

              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-bold text-gray-900">{stats.following_count}</span>
                  <span className="text-gray-600 ml-1">Following</span>
                </div>
                <div>
                  <span className="font-bold text-gray-900">{stats.follower_count}</span>
                  <span className="text-gray-600 ml-1">Followers</span>
                </div>
              </div>

              {/* Links */}
              {(profile?.website || profile?.twitter_handle || profile?.linkedin_url) && (
                <div className="flex gap-4 mt-4">
                  {profile.website && (
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      🌐 Website
                    </a>
                  )}
                  {profile.twitter_handle && (
                    <a
                      href={`https://twitter.com/${profile.twitter_handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      🐦 Twitter
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a
                      href={profile.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-sm"
                    >
                      💼 LinkedIn
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl mb-1">💝</div>
            <div className="text-2xl font-bold text-gray-900">
              ₹{stats.total_donations.toLocaleString('en-IN')}
            </div>
            <div className="text-sm text-gray-600">Donated</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl mb-1">🙋</div>
            <div className="text-2xl font-bold text-gray-900">{stats.volunteer_applications}</div>
            <div className="text-sm text-gray-600">Volunteer Apps</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl mb-1">📝</div>
            <div className="text-2xl font-bold text-gray-900">{stats.posts_created}</div>
            <div className="text-sm text-gray-600">Posts</div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-2xl mb-1">🏆</div>
            <div className="text-2xl font-bold text-gray-900">{stats.badges_earned}</div>
            <div className="text-sm text-gray-600">Badges</div>
          </div>
        </div>

        {/* Badges */}
        {badges.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Badges & Achievements</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {badges.map((badge) => (
                <div
                  key={badge.id}
                  className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
                >
                  <div className="text-3xl mb-2">{badge.badge_type === 'donor_hero' ? '💛' : badge.badge_type === 'volunteer_champ' ? '🌟' : badge.badge_type === 'csr_star' ? '🏆' : badge.badge_type === 'campaign_supporter' ? '🎯' : badge.badge_type === 'community_builder' ? '🤝' : '✨'}</div>
                  <h3 className="font-semibold text-gray-900 capitalize">
                    {badge.badge_type.replace('_', ' ')}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Earned on {new Date(badge.earned_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Posts */}
        {filteredPosts.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Posts</h2>
            <div className="space-y-4">
              {filteredPosts.map((post) => (
                <Link
                  key={post.id}
                  href={`/community/posts/${post.id}`}
                  className="block p-4 border border-gray-200 rounded-lg hover:border-blue-500 transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 mb-2">{post.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>❤️ {post.like_count}</span>
                    <span>💬 {post.comment_count}</span>
                    <span className="text-xs">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
