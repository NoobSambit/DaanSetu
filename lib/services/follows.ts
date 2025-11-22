import { createClient } from '@/lib/supabase/server'

export type FollowingType = 'user' | 'ngo' | 'corporate'

export interface Follow {
  id: string
  follower_id: string
  following_id: string
  following_type: FollowingType
  created_at: string
}

export interface FollowWithDetails extends Follow {
  follower: {
    id: string
    name: string
    email: string
    role: string
  }
}

// Follow an entity (user, NGO, or corporate)
export async function followEntity(
  followerId: string,
  followingId: string,
  followingType: FollowingType
): Promise<Follow> {
  const supabase = await createClient()

  const { data: follow, error } = await supabase
    .from('follows')
    .insert({
      follower_id: followerId,
      following_id: followingId,
      following_type: followingType
    })
    .select()
    .single()

  if (error) {
    console.error('Error following entity:', error)
    throw new Error('Failed to follow entity')
  }

  return follow
}

// Unfollow an entity
export async function unfollowEntity(
  followerId: string,
  followingId: string,
  followingType: FollowingType
): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('follows')
    .delete()
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .eq('following_type', followingType)

  if (error) {
    console.error('Error unfollowing entity:', error)
    throw new Error('Failed to unfollow entity')
  }
}

// Check if user is following an entity
export async function isFollowing(
  followerId: string,
  followingId: string,
  followingType: FollowingType
): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('is_following', {
      user_uuid: followerId,
      entity_uuid: followingId,
      entity_type_param: followingType
    })

  if (error) {
    console.error('Error checking follow status:', error)
    return false
  }

  return !!data
}

// Get follower count for an entity
export async function getFollowerCount(entityId: string, entityType: FollowingType): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_follower_count', {
      entity_uuid: entityId,
      entity_type_param: entityType
    })

  if (error) {
    console.error('Error getting follower count:', error)
    return 0
  }

  return data || 0
}

// Get following count for a user
export async function getFollowingCount(userId: string): Promise<number> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .rpc('get_following_count', { user_uuid: userId })

  if (error) {
    console.error('Error getting following count:', error)
    return 0
  }

  return data || 0
}

// Get list of users that a user is following
export async function getFollowing(userId: string): Promise<Follow[]> {
  const supabase = await createClient()

  const { data: follows, error } = await supabase
    .from('follows')
    .select('*')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting following list:', error)
    return []
  }

  return follows
}

// Get list of followers for an entity
export async function getFollowers(entityId: string, entityType: FollowingType): Promise<FollowWithDetails[]> {
  const supabase = await createClient()

  const { data: follows, error } = await supabase
    .from('follows')
    .select(`
      *,
      follower:users!follows_follower_id_fkey(id, name, email, role)
    `)
    .eq('following_id', entityId)
    .eq('following_type', entityType)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting followers:', error)
    return []
  }

  return follows.map(follow => ({
    ...follow,
    follower: Array.isArray(follow.follower) ? follow.follower[0] : follow.follower
  }))
}

// Get posts from followed entities
export async function getFollowingFeed(userId: string): Promise<any[]> {
  const supabase = await createClient()

  // Get all entities the user is following
  const { data: follows, error: followError } = await supabase
    .from('follows')
    .select('following_id, following_type')
    .eq('follower_id', userId)

  if (followError || !follows || follows.length === 0) {
    return []
  }

  // Get posts from followed users (where author_id matches following_id)
  const followedUserIds = follows
    .filter(f => f.following_type === 'user')
    .map(f => f.following_id)

  const { data: posts, error: postsError } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, email, role)
    `)
    .in('author_id', followedUserIds.length > 0 ? followedUserIds : [''])
    .order('created_at', { ascending: false })
    .limit(50)

  if (postsError) {
    console.error('Error getting following feed:', postsError)
    return []
  }

  return posts
}
