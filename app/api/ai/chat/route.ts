import { createClient } from '@/lib/supabase/server'
import { chatWithDaanSetu } from '@/lib/services/gemini'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const supabase = await createClient()

    // Fetch NGOs for context (limit to recent/popular)
    const { data: ngos } = await supabase
      .from('ngos')
      .select('name, category, city, description')
      .limit(30)

    // Fetch campaigns for context
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('title, category, goal_amount')
      .eq('status', 'active')
      .limit(15)

    // Generate AI response
    const response = await chatWithDaanSetu(message, {
      ngos: ngos || [],
      campaigns: campaigns || [],
    })

    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in chat API:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}
