import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { rateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Verify Razorpay payment signature and record donation
 * POST /api/payment/verify
 */
async function handler(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      orderId,
      paymentId,
      signature,
      amount,
      ngoId,
      campaignId,
      corporateCampaignId,
      cause,
      isAnonymous,
    } = body

    // Validate required fields
    if (!orderId || !paymentId || !amount || !ngoId || !cause) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Always verify payment signature
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET

    if (!razorpayKeySecret) {
      return NextResponse.json(
        { error: 'Payment verification not configured' },
        { status: 500 }
      )
    }

    if (!signature) {
      return NextResponse.json(
        { error: 'Payment signature is required' },
        { status: 400 }
      )
    }

    // Verify signature
    const generatedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (generatedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Create donation record
    const { data: donation, error: donationError } = await supabase
      .from('donations')
      .insert({
        user_id: user.id,
        ngo_id: ngoId,
        campaign_id: campaignId || null,
        corporate_campaign_id: corporateCampaignId || null,
        amount: amount,
        cause: cause,
        is_anonymous: isAnonymous || false,
        payment_status: 'completed',
      })
      .select()
      .single()

    if (donationError) {
      console.error('Error creating donation:', donationError)
      return NextResponse.json(
        { error: 'Failed to record donation' },
        { status: 500 }
      )
    }

    // Update campaign amount if applicable using atomic RPC
    if (campaignId) {
      await supabase.rpc('increment_campaign_amount', {
        campaign_id: campaignId,
        amount_to_add: amount,
      })
    }

    // Update corporate campaign amount if applicable using atomic RPC
    if (corporateCampaignId) {
      await supabase.rpc('increment_corporate_campaign_amount', {
        campaign_id: corporateCampaignId,
        amount_to_add: amount,
      })
    }

    // Log activity
    await supabase.rpc('log_activity', {
      p_user_id: user.id,
      p_activity_type: 'donation',
      p_entity_type: 'donation',
      p_entity_id: donation.id,
      p_metadata: {
        amount,
        ngoId,
        campaignId,
        corporateCampaignId,
      },
    })

    return NextResponse.json({
      success: true,
      donation,
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

export const POST = rateLimit(RATE_LIMITS.PAYMENT)(handler)
