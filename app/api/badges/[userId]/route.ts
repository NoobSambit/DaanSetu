import { NextRequest, NextResponse } from 'next/server'
import { getUserBadges } from '@/lib/services/badges'

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const badges = await getUserBadges(params.userId)
    return NextResponse.json(badges)
  } catch (error) {
    console.error('Error fetching badges:', error)
    return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
  }
}
