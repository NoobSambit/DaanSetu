import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import SignUpLayout from '@/components/auth/SignUpLayout'
import SignUpForm from '@/components/auth/SignUpForm'
import { getUserRole } from '@/lib/auth/profile'
import { getPostAuthDestination } from '@/lib/auth/redirects'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Create account | DaanSetu',
  description: 'Join the ecosystem creating measurable impact across India.',
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
    <SignUpLayout>
      <SignUpForm />
    </SignUpLayout>
  )
}
