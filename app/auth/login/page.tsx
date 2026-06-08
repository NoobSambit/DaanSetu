import { redirect } from 'next/navigation'

import { getSafeRedirectPath } from '@/lib/auth/redirects'

export default async function LegacyLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const params = await searchParams
  const requestedNext =
    typeof params.redirect === 'string'
      ? params.redirect
      : typeof params.next === 'string'
        ? params.next
        : null
  const next = getSafeRedirectPath(requestedNext, '')

  redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : '/sign-in')
}
