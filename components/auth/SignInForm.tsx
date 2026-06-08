'use client'

import Link from 'next/link'
import { useFormState } from 'react-dom'

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

  return (
    <form action={formAction} className="space-y-5">
      {next && <input type="hidden" name="next" value={next} />}

      {notice && (
        <div role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {notice}
        </div>
      )}

      {initialError && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {initialError}
        </div>
      )}

      {state.message && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-semibold text-slate-800">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          autoFocus
          aria-invalid={Boolean(state.fieldErrors?.email)}
          aria-describedby={state.fieldErrors?.email ? 'email-error' : undefined}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        {state.fieldErrors?.email && (
          <p id="email-error" className="mt-1.5 text-xs font-medium text-red-700">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-800">Password</span>
          <Link href="/forgot-password" className="text-xs font-semibold text-blue-700 hover:text-blue-800">
            Forgot password?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          label=""
          autoComplete="current-password"
          error={state.fieldErrors?.password}
          hideLabel
        />
      </div>

      <SubmitButton>Sign in</SubmitButton>

      <p className="text-center text-sm text-slate-600">
        New to DaanSetu?{' '}
        <Link href="/sign-up" className="font-semibold text-blue-700 hover:text-blue-800">
          Create an account
        </Link>
      </p>
    </form>
  )
}
