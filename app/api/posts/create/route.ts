import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPost } from '@/lib/services/posts'
import { checkAndAwardBadges } from '@/lib/services/badges'
import { notifyBadgeUnlocked } from '@/lib/services/notifications'
import { BADGE_INFO } from '@/lib/services/badges'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { author_id, author_role, title, content, image_url, category } = body

    // Verify user is authorized to create posts
    if (author_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user role
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || !['ngo', 'corporate', 'admin'].includes(userData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Create the post
    const post = await createPost({
      author_id,
      author_role,
      title,
      content,
      image_url: image_url || undefined,
      category
    })

    // Check and award badges
    const newBadges = await checkAndAwardBadges(user.id)

    // Notify about new badges
    for (const badge of newBadges) {
      const badgeInfo = BADGE_INFO[badge.badge_type]
      await notifyBadgeUnlocked(user.id, badgeInfo.name)
    }

    return NextResponse.json(post, { status: 201 })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json({ error: 'Failed to create post' }, { status: 500 })
  }
}
