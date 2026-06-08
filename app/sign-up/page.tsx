import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import AuthShell from '@/components/auth/AuthShell'
import SignUpForm from '@/components/auth/SignUpForm'
import { getUserRole } from '@/lib/auth/profile'
import { getPostAuthDestination } from '@/lib/auth/redirects'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Create account | DaanSetu',
  description: 'Create your free DaanSetu account.',
}

export default async function SignUpPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const role = await getUserRole(supabase, user.id)
    redirect(getPostAuthDestination(role))
  }

  return (
    <AuthShell
      title="Create your account"
      description="Choose how you want to participate. You can start for free."
    >
      <SignUpForm />
    </AuthShell>
  )
}
