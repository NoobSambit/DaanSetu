import { createClient } from '@/lib/supabase/server'
import { analyzeAndFlagNGO, analyzeAndFlagCampaign } from '@/lib/services/ai-flags'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit'

async function handler(request: NextRequest) {
  try {
    const { entityType, entityId } = await request.json()

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'Entity type and ID are required' }, { status: 400 })
    }

    if (entityType !== 'ngo' && entityType !== 'campaign') {
      return NextResponse.json({ error: 'Invalid entity type' }, { status: 400 })
    }

    const supabase = await createClient()

    // Check authentication (admin only for manual flagging)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let analysis

    if (entityType === 'ngo') {
      // Fetch NGO details
      const { data: ngo } = await supabase
        .from('ngos')
        .select('id, name, description')
        .eq('id', entityId)
        .single()

      if (!ngo) {
        return NextResponse.json({ error: 'NGO not found' }, { status: 404 })
      }

      analysis = await analyzeAndFlagNGO(ngo.id, ngo.name, ngo.description)
    } else {
      // Fetch campaign details
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('id, title, description')
        .eq('id', entityId)
        .single()

      if (!campaign) {
        return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      }

      analysis = await analyzeAndFlagCampaign(campaign.id, campaign.title, campaign.description)
    }

    return NextResponse.json({ analysis })
  } catch (error) {
    console.error('Error in analyze-content API:', error)
    return NextResponse.json(
      { error: 'Failed to analyze content' },
      { status: 500 }
    )
  }
}

export const POST = rateLimit(RATE_LIMITS.AI)(handler)
