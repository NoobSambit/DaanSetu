import { getBrowserClient } from '@/lib/supabase'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface PostBookmark {
  id: string
  user_id: string
  post_id: string
  created_at: string
}

export interface BookmarkWithPost extends PostBookmark {
  post: {
    id: string
    author_id: string
    author_role: string
    title: string
    content: string
    image_url: string | null
    category: string
    created_at: string
    updated_at: string
  }
}

// Bookmark a post
export async function bookmarkPost(userId: string, postId: string, supabaseClient?: SupabaseClient): Promise<PostBookmark> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: bookmark, error } = await supabase
    .from('post_bookmarks')
    .insert({ user_id: userId, post_id: postId })
    .select()
    .single()

  if (error) {
    console.error('Error bookmarking post:', error)
    throw new Error('Failed to bookmark post')
  }

  return bookmark
}

// Remove bookmark
export async function unbookmarkPost(userId: string, postId: string, supabaseClient?: SupabaseClient): Promise<void> {
  const supabase = supabaseClient || getBrowserClient()

  const { error } = await supabase
    .from('post_bookmarks')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId)

  if (error) {
    console.error('Error removing bookmark:', error)
    throw new Error('Failed to remove bookmark')
  }
}

// Check if user has bookmarked a post
export async function hasBookmarked(userId: string, postId: string, supabaseClient?: SupabaseClient): Promise<boolean> {
  const supabase = supabaseClient || getBrowserClient()

  const { data, error } = await supabase
    .from('post_bookmarks')
    .select('id')
    .eq('user_id', userId)
    .eq('post_id', postId)
    .single()

  return !error && !!data
}

// Get user's bookmarked posts
export async function getUserBookmarks(userId: string, supabaseClient?: SupabaseClient): Promise<BookmarkWithPost[]> {
  const supabase = supabaseClient || getBrowserClient()

  const { data: bookmarks, error } = await supabase
    .from('post_bookmarks')
    .select(`
      *,
      post:posts(*)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error getting bookmarks:', error)
    return []
  }

  return bookmarks.map(bookmark => ({
    ...bookmark,
    post: Array.isArray(bookmark.post) ? bookmark.post[0] : bookmark.post
  }))
}

// Get bookmark count for a post
export async function getBookmarkCount(postId: string, supabaseClient?: SupabaseClient): Promise<number> {
  const supabase = supabaseClient || getBrowserClient()

  const { count, error } = await supabase
    .from('post_bookmarks')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  if (error) {
    console.error('Error getting bookmark count:', error)
    return 0
  }

  return count || 0
}
