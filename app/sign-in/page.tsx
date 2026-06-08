import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import AuthLayout from '@/components/auth/AuthLayout'
import SignInForm from '@/components/auth/SignInForm'
import { getUserRole } from '@/lib/auth/profile'
import {
  getPostAuthDestination,
  getSafeRedirectPath,
} from '@/lib/auth/redirects'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Sign in | DaanSetu',
  description: 'Sign in to your DaanSetu account.',
}

const notices: Record<string, string> = {
  'password-updated': 'Your password was updated. Sign in with your new password.',
  'signed-out': 'You have been signed out.',
}

const errors: Record<string, string> = {
  'invalid-link': 'This sign-in link is invalid or has expired.',
  'profile-missing': 'Your account setup is incomplete. Please contact support.',
}

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const requestedNext = typeof params.next === 'string' ? params.next : null
  const next = getSafeRedirectPath(requestedNext, '')
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const role = await getUserRole(supabase, user.id)
    redirect(next || getPostAuthDestination(role))
  }

  const messageKey = typeof params.message === 'string' ? params.message : ''
  const errorKey = typeof params.error === 'string' ? params.error : ''

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in to continue managing your impact."
    >
      <SignInForm
        next={next || undefined}
        notice={notices[messageKey]}
        initialError={errors[errorKey]}
      />
    </AuthLayout>
  )
}
