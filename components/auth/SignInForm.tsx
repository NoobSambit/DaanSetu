'use client'

import { Mail, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useFormState } from 'react-dom'
import { useState } from 'react'

import { signInAction } from '@/app/auth/actions'
import { INITIAL_AUTH_STATE } from '@/lib/auth/types'

import { PasswordInput, SubmitButton } from './FormControls'

export default function SignInForm({
  next,
  notice,
  initialError,
}: {
  next?: string
  notice?: string
  initialError?: string
}) {
  const [state, formAction] = useFormState(signInAction, INITIAL_AUTH_STATE)
  const [password, setPassword] = useState('')

  return (
    <form action={formAction} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}

      {notice && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-[13px] text-emerald-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          {notice}
        </div>
      )}

      {initialError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          {initialError}
        </div>
      )}

      {state.message && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-1.5 block text-[12px] font-bold text-slate-800">
          Email Address
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Mail className="h-4 w-4" strokeWidth={2} />
          </div>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            placeholder="Enter your email address"
            required
            autoFocus
            aria-invalid={Boolean(state.fieldErrors?.email)}
            aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-[13px] text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]"
          />
        </div>
        {state.fieldErrors?.email && (
          <p id="email-error" className="mt-1 text-[11px] font-medium text-red-700">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label htmlFor="password" className="text-[12px] font-bold text-slate-800">
            Password
          </label>
          <Link href="/forgot-password" className="text-[11px] font-bold text-[#2563EB] hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            hideLabel
            autoComplete="current-password"
            error={state.fieldErrors?.password}
            icon={<Lock className="h-4 w-4" strokeWidth={2} />}
          />
          <input 
            type="hidden" 
            value={password}
            className="hidden" 
          />
          <div className="absolute inset-0 top-6 opacity-0" onChange={(e) => setPassword((e.target as HTMLInputElement).value)}></div>
        </div>
      </div>

      <div className="pt-2">
        <SubmitButton rightIcon={<ArrowRight className="h-4 w-4 ml-1.5" />}>Sign In</SubmitButton>
      </div>

      <p className="text-center text-[12px] text-slate-500 pt-2">
        New to DaanSetu?{' '}
        <Link href="/sign-up" className="font-bold text-[#2563EB] hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  )
}
