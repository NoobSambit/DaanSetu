import { createClient } from '@/lib/supabase/client'
import { analyzeContentQuality } from './gemini'
import type { AIFlag } from '../types/database.types'

/**
 * Flag an NGO or campaign for quality issues
 */
export async function flagEntity(
  entityType: 'ngo' | 'campaign',
  entityId: string,
  reason: string,
  confidence: string
) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('ai_flags')
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      reason,
      confidence,
    })
    .select()
    .single()

  if (error) throw error
  return data as AIFlag
}

/**
 * Get all AI flags (admin only)
 */
export async function getAllFlags() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('ai_flags')
    .select(`
      *,
      ngos:entity_id (
        id,
        name,
        category
      ),
      campaigns:entity_id (
        id,
        title,
        category
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Delete an AI flag (admin only)
 */
export async function deleteFlag(flagId: string) {
  const supabase = createClient()

  const { error } = await supabase
    .from('ai_flags')
    .delete()
    .eq('id', flagId)

  if (error) throw error
}

/**
 * Analyze and flag NGO content if suspicious
 */
export async function analyzeAndFlagNGO(ngoId: string, title: string, description: string) {
  const analysis = await analyzeContentQuality('ngo', { title, description })

  if (analysis.is_suspicious && analysis.confidence !== 'low') {
    await flagEntity('ngo', ngoId, analysis.reason, analysis.confidence)
  }

  return analysis
}

/**
 * Analyze and flag campaign content if suspicious
 */
export async function analyzeAndFlagCampaign(campaignId: string, title: string, description: string) {
  const analysis = await analyzeContentQuality('campaign', { title, description })

  if (analysis.is_suspicious && analysis.confidence !== 'low') {
    await flagEntity('campaign', campaignId, analysis.reason, analysis.confidence)
  }

  return analysis
}
