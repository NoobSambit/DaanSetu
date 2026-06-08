import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy | DaanSetu',
}

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12">
      <article className="mx-auto max-w-3xl rounded-lg border border-slate-200 bg-white p-6 sm:p-10">
        <Link href="/" className="text-sm font-semibold text-blue-700">DaanSetu</Link>
        <h1 className="mt-5 text-3xl font-bold text-slate-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated June 8, 2026</p>
        <div className="mt-8 space-y-6 text-sm leading-7 text-slate-700">
          <p>
            DaanSetu stores the account information needed to provide the service, including
            your name, email address, account type, and activity you choose to perform.
          </p>
          <p>
            Passwords and authentication sessions are managed by Supabase Auth. DaanSetu does
            not store plaintext passwords.
          </p>
          <p>
            Public profile and organization information may be visible to other visitors.
            Authentication credentials and private session tokens are not public profile data.
          </p>
          <p>
            This policy is a concise project policy and should be reviewed by qualified legal
            counsel before a public production launch.
          </p>
        </div>
      </article>
    </main>
  )
}
