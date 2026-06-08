import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import AuthShell from '@/components/auth/AuthShell'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Set new password | DaanSetu',
}

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in?error=invalid-link')
  }

  return (
    <AuthShell
      title="Set a new password"
      description="Choose a strong password you have not used for this account before."
    >
      <ResetPasswordForm />
    </AuthShell>
  )
}
