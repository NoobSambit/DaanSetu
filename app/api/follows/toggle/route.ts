import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { followEntity, unfollowEntity, isFollowing } from '@/lib/services/follows'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { targetId, targetType } = body

    if (!targetId || !targetType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check current status
    const currentlyFollowing = await isFollowing(user.id, targetId, targetType)

    if (currentlyFollowing) {
      // Unfollow
      await unfollowEntity(user.id, targetId, targetType)
      return NextResponse.json({ isFollowing: false })
    } else {
      // Follow
      await followEntity(user.id, targetId, targetType)
      return NextResponse.json({ isFollowing: true })
    }
  } catch (error) {
    console.error('Error toggling follow:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
