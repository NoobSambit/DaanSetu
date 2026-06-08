import { Heart, LockKeyhole, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function AuthShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: React.ReactNode
}) {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid min-h-screen max-w-6xl lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="hidden border-r border-slate-200 bg-white px-12 py-14 lg:flex lg:flex-col lg:justify-between">
          <Link href="/" className="flex items-center gap-3 text-slate-950">
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <Heart className="h-5 w-5 fill-white text-white" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-bold leading-5">DaanSetu</span>
              <span className="text-xs text-slate-500">A Bridge for Giving</span>
            </span>
          </Link>

          <div className="space-y-7">
            <div>
              <p className="mb-3 text-sm font-semibold text-blue-700">Secure access</p>
              <h2 className="max-w-sm text-3xl font-bold leading-tight text-slate-950">
                One account for giving, volunteering, NGO work, and CSR.
              </h2>
            </div>
            <div className="space-y-4 text-sm text-slate-600">
              <p className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" aria-hidden="true" />
                Email verification and secure cookie-based sessions.
              </p>
              <p className="flex gap-3">
                <LockKeyhole className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" aria-hidden="true" />
                Your password is handled by Supabase Auth and is never stored by DaanSetu.
              </p>
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Authentication uses Supabase&apos;s free tier. No paid identity provider is required.
          </p>
        </aside>

        <section className="flex items-center justify-center px-4 py-10 sm:px-8 lg:px-14">
          <div className="w-full max-w-md">
            <Link href="/" className="mb-10 flex items-center gap-2 lg:hidden">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600">
                <Heart className="h-4 w-4 fill-white text-white" aria-hidden="true" />
              </span>
              <span className="font-bold text-slate-950">DaanSetu</span>
            </Link>

            <div className="mb-7">
              <h1 className="text-3xl font-bold text-slate-950">{title}</h1>
              <p className="mt-2 text-sm text-slate-600">{description}</p>
            </div>

            {children}
          </div>
        </section>
      </div>
    </main>
  )
}
