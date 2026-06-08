import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import NgoProfileForm from '@/components/auth/NgoProfileForm'
import { getUserRole } from '@/lib/auth/profile'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Set up NGO profile | DaanSetu',
}

export default async function NgoProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in?next=/ngo/profile')
  }

  if ((await getUserRole(supabase, user.id)) !== 'ngo') {
    redirect('/dashboard')
  }

  const { data: existingNgo } = await supabase
    .from('ngos')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingNgo) {
    redirect('/ngo/dashboard/analytics')
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold text-blue-700">NGO onboarding</p>
          <h1 className="text-3xl font-bold text-slate-950">Create your organization profile</h1>
          <p className="mt-2 text-sm text-slate-600">
            This information powers your public listing, campaigns, volunteer opportunities, and analytics.
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-6 sm:p-8">
          <NgoProfileForm />
        </div>
      </div>
    </main>
  )
}
