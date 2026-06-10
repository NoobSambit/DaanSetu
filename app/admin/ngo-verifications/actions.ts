'use server'

import { revalidatePath } from 'next/cache'

import { createClient } from '@/lib/supabase/server'

export async function reviewNgoVerificationAction(formData: FormData) {
  const verificationId = String(formData.get('verificationId') ?? '')
  const decision = String(formData.get('decision') ?? '')
  const notes = String(formData.get('notes') ?? '').trim()
  if (!verificationId || !['verified', 'rejected'].includes(decision)) return

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return

  const { data: verification } = await supabase
    .from('ngo_verifications')
    .select('ngo_id, verification_status')
    .eq('id', verificationId)
    .single()
  if (!verification || verification.verification_status !== 'pending') return

  if (decision === 'verified') {
    const { count } = await supabase
      .from('ngo_verification_documents')
      .select('id', { count: 'exact', head: true })
      .eq('verification_id', verificationId)
    if (!count) return
  }

  const { error } = await supabase
    .from('ngo_verifications')
    .update({
      verification_status: decision,
      verified_by: user.id,
      verification_date: new Date().toISOString(),
      reviewed_at: new Date().toISOString(),
      verification_notes: notes || null,
      documents_verified: decision === 'verified',
    })
    .eq('id', verificationId)
  if (error) return

  await supabase.from('ngos').update({ is_verified: decision === 'verified' }).eq('id', verification.ngo_id)
  revalidatePath('/admin/ngo-verifications')
  revalidatePath(`/ngos/${verification.ngo_id}`)
}

