import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { bookmarkPost, unbookmarkPost, hasBookmarked } from '@/lib/services/bookmarks'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { postId } = body

    if (!postId) {
      return NextResponse.json({ error: 'Missing post ID' }, { status: 400 })
    }

    // Check current status
    const currentlyBookmarked = await hasBookmarked(user.id, postId)

    if (currentlyBookmarked) {
      // Remove bookmark
      await unbookmarkPost(user.id, postId)
      return NextResponse.json({ isBookmarked: false })
    } else {
      // Add bookmark
      await bookmarkPost(user.id, postId)
      return NextResponse.json({ isBookmarked: true })
    }
  } catch (error) {
    console.error('Error toggling bookmark:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
