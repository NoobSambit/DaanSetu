'use client'

import Link from 'next/link'
import { useFormState } from 'react-dom'

import { requestPasswordResetAction } from '@/app/auth/actions'
import { INITIAL_AUTH_STATE } from '@/lib/auth/types'

import { SubmitButton } from './FormControls'

export default function ForgotPasswordForm() {
  const [state, formAction] = useFormState(
    requestPasswordResetAction,
    INITIAL_AUTH_STATE
  )

  return (
    <form action={formAction} className="space-y-5">
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
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1.5 text-xs font-medium text-red-700">{state.fieldErrors.email}</p>
        )}
      </div>
      <SubmitButton>Send recovery link</SubmitButton>
      <p className="text-center text-sm">
        <Link href="/sign-in" className="font-semibold text-blue-700 hover:text-blue-800">
          Back to sign in
        </Link>
      </p>
    </form>
  )
}
