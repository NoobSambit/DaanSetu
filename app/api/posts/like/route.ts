import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { likePost, unlikePost, getPost } from '@/lib/services/posts'
import { notifyPostLiked } from '@/lib/services/notifications'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postId, action } = body

    if (action === 'like') {
      await likePost(postId, user.id)

      // Get post details and notify author
      const post = await getPost(postId)
      if (post && post.author_id !== user.id) {
        const { data: userData } = await supabase
          .from('users')
          .select('name')
          .eq('id', user.id)
          .single()

        if (userData) {
          await notifyPostLiked(post.author_id, userData.name, postId, post.title)
        }
      }
    } else if (action === 'unlike') {
      await unlikePost(postId, user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error toggling like:', error)
    return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 })
  }
}
