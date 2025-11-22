import { createClient } from '@/lib/supabase/server'
import type { Post, PostCategory, PostAuthorRole, PostLike, PostComment } from '@/lib/types/database.types'

export interface PostWithAuthor extends Post {
  author: {
    id: string
    name: string
    email: string
    role: string
  }
  like_count: number
  comment_count: number
  user_has_liked?: boolean
}

export interface PostCommentWithUser extends PostComment {
  user: {
    id: string
    name: string
    email: string
  }
}

export interface CreatePostData {
  author_id: string
  author_role: PostAuthorRole
  title: string
  content: string
  image_url?: string
  category: PostCategory
}

export interface UpdatePostData {
  title?: string
  content?: string
  image_url?: string
  category?: PostCategory
}

// Create a new post
export async function createPost(data: CreatePostData): Promise<Post> {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .insert(data)
    .select()
    .single()

  if (error) {
    console.error('Error creating post:', error)
    throw new Error('Failed to create post')
  }

  return post
}

// Get all posts with author info, like/comment counts
export async function getPosts(userId?: string): Promise<PostWithAuthor[]> {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, email, role)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching posts:', error)
    throw new Error('Failed to fetch posts')
  }

  // Get like and comment counts for all posts
  const postsWithCounts = await Promise.all(
    posts.map(async (post) => {
      const [likeCount, commentCount, userHasLiked] = await Promise.all([
        getPostLikeCount(post.id),
        getPostCommentCount(post.id),
        userId ? hasUserLikedPost(post.id, userId) : false
      ])

      return {
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
        like_count: likeCount,
        comment_count: commentCount,
        user_has_liked: userHasLiked
      }
    })
  )

  return postsWithCounts
}

// Get a single post by ID
export async function getPost(postId: string, userId?: string): Promise<PostWithAuthor | null> {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, email, role)
    `)
    .eq('id', postId)
    .single()

  if (error || !post) {
    return null
  }

  const [likeCount, commentCount, userHasLiked] = await Promise.all([
    getPostLikeCount(post.id),
    getPostCommentCount(post.id),
    userId ? hasUserLikedPost(post.id, userId) : false
  ])

  return {
    ...post,
    author: Array.isArray(post.author) ? post.author[0] : post.author,
    like_count: likeCount,
    comment_count: commentCount,
    user_has_liked: userHasLiked
  }
}

// Update a post
export async function updatePost(postId: string, data: UpdatePostData): Promise<Post> {
  const supabase = await createClient()

  const { data: post, error } = await supabase
    .from('posts')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', postId)
    .select()
    .single()

  if (error) {
    console.error('Error updating post:', error)
    throw new Error('Failed to update post')
  }

  return post
}

// Delete a post
export async function deletePost(postId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', postId)

  if (error) {
    console.error('Error deleting post:', error)
    throw new Error('Failed to delete post')
  }
}

// Like a post
export async function likePost(postId: string, userId: string): Promise<PostLike> {
  const supabase = await createClient()

  const { data: like, error } = await supabase
    .from('post_likes')
    .insert({ post_id: postId, user_id: userId })
    .select()
    .single()

  if (error) {
    console.error('Error liking post:', error)
    throw new Error('Failed to like post')
  }

  return like
}

// Unlike a post
export async function unlikePost(postId: string, userId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('post_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)

  if (error) {
    console.error('Error unliking post:', error)
    throw new Error('Failed to unlike post')
  }
}

// Check if user has liked a post
export async function hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single()

  return !error && !!data
}

// Get like count for a post
export async function getPostLikeCount(postId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('post_likes')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (error) {
    console.error('Error getting like count:', error)
    return 0
  }

  return count || 0
}

// Add a comment to a post
export async function addComment(postId: string, userId: string, content: string): Promise<PostComment> {
  const supabase = await createClient()

  const { data: comment, error } = await supabase
    .from('post_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select()
    .single()

  if (error) {
    console.error('Error adding comment:', error)
    throw new Error('Failed to add comment')
  }

  return comment
}

// Get comments for a post
export async function getPostComments(postId: string): Promise<PostCommentWithUser[]> {
  const supabase = await createClient()

  const { data: comments, error } = await supabase
    .from('post_comments')
    .select(`
      *,
      user:users!post_comments_user_id_fkey(id, name, email)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching comments:', error)
    throw new Error('Failed to fetch comments')
  }

  return comments.map(comment => ({
    ...comment,
    user: Array.isArray(comment.user) ? comment.user[0] : comment.user
  }))
}

// Get comment count for a post
export async function getPostCommentCount(postId: string): Promise<number> {
  const supabase = await createClient()

  const { count, error } = await supabase
    .from('post_comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (error) {
    console.error('Error getting comment count:', error)
    return 0
  }

  return count || 0
}

// Delete a comment
export async function deleteComment(commentId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('post_comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    console.error('Error deleting comment:', error)
    throw new Error('Failed to delete comment')
  }
}

// Post categories for reference
export const POST_CATEGORIES: PostCategory[] = ['update', 'story', 'announcement']

// Post category labels
export const POST_CATEGORY_LABELS: Record<PostCategory, string> = {
  update: 'Update',
  story: 'Success Story',
  announcement: 'Announcement'
}

// Get trending posts (most engagement in last 7 days)
export async function getTrendingPosts(limit: number = 10): Promise<PostWithAuthor[]> {
  const supabase = await createClient()

  // Get trending post IDs from database function
  const { data: trendingData, error: trendingError } = await supabase
    .rpc('get_trending_posts', { limit_count: limit })

  if (trendingError || !trendingData || trendingData.length === 0) {
    return []
  }

  const trendingPostIds = trendingData.map((t: any) => t.post_id)

  // Get full post data
  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, email, role)
    `)
    .in('id', trendingPostIds)

  if (error) {
    console.error('Error fetching trending posts:', error)
    return []
  }

  // Get counts for each post
  const postsWithCounts = await Promise.all(
    posts.map(async (post) => {
      const [likeCount, commentCount] = await Promise.all([
        getPostLikeCount(post.id),
        getPostCommentCount(post.id)
      ])

      return {
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
        like_count: likeCount,
        comment_count: commentCount
      }
    })
  )

  return postsWithCounts
}

// Get featured posts
export async function getFeaturedPosts(limit: number = 5): Promise<PostWithAuthor[]> {
  const supabase = await createClient()

  const { data: posts, error } = await supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, email, role)
    `)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured posts:', error)
    return []
  }

  const postsWithCounts = await Promise.all(
    posts.map(async (post) => {
      const [likeCount, commentCount] = await Promise.all([
        getPostLikeCount(post.id),
        getPostCommentCount(post.id)
      ])

      return {
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
        like_count: likeCount,
        comment_count: commentCount
      }
    })
  )

  return postsWithCounts
}

// Mark post as featured (admin only)
export async function markPostAsFeatured(postId: string, isFeatured: boolean): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('posts')
    .update({ is_featured: isFeatured })
    .eq('id', postId)

  if (error) {
    console.error('Error updating featured status:', error)
    throw new Error('Failed to update featured status')
  }
}

// Increment post view count
export async function incrementPostViewCount(postId: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .rpc('increment_post_view_count', { post_uuid: postId })

  if (error) {
    console.error('Error incrementing view count:', error)
  }
}

// Track post view
export async function trackPostView(postId: string, userId?: string, ipAddress?: string): Promise<void> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('post_views')
    .insert({
      post_id: postId,
      user_id: userId || null,
      ip_address: ipAddress || null
    })

  if (error) {
    console.error('Error tracking post view:', error)
  }

  // Also increment the counter
  await incrementPostViewCount(postId)
}

// Get posts with filters
export async function getPostsFiltered(
  userId?: string,
  filters?: {
    category?: PostCategory
    authorRole?: PostAuthorRole
    search?: string
    featured?: boolean
    limit?: number
  }
): Promise<PostWithAuthor[]> {
  const supabase = await createClient()

  let query = supabase
    .from('posts')
    .select(`
      *,
      author:users!posts_author_id_fkey(id, name, email, role)
    `)

  // Apply filters
  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.authorRole) {
    query = query.eq('author_role', filters.authorRole)
  }

  if (filters?.featured !== undefined) {
    query = query.eq('is_featured', filters.featured)
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
  }

  query = query.order('created_at', { ascending: false })

  if (filters?.limit) {
    query = query.limit(filters.limit)
  }

  const { data: posts, error } = await query

  if (error) {
    console.error('Error fetching filtered posts:', error)
    return []
  }

  const postsWithCounts = await Promise.all(
    posts.map(async (post) => {
      const [likeCount, commentCount, userHasLiked] = await Promise.all([
        getPostLikeCount(post.id),
        getPostCommentCount(post.id),
        userId ? hasUserLikedPost(post.id, userId) : false
      ])

      return {
        ...post,
        author: Array.isArray(post.author) ? post.author[0] : post.author,
        like_count: likeCount,
        comment_count: commentCount,
        user_has_liked: userHasLiked
      }
    })
  )

  return postsWithCounts
}
