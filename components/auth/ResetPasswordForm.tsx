'use client'

import { useActionState } from 'react'

import { resetPasswordAction } from '@/app/auth/actions'
import { INITIAL_AUTH_STATE } from '@/lib/auth/types'

import { PasswordInput, SubmitButton } from './FormControls'

export default function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPasswordAction, INITIAL_AUTH_STATE)

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      )}
      <PasswordInput
        id="password"
        name="password"
        label="New password"
        autoComplete="new-password"
        error={state.fieldErrors?.password}
        hint="Use 12+ characters with uppercase, lowercase, a number, and a symbol."
      />
      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm new password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
      />
      <SubmitButton>Update password</SubmitButton>
    </form>
  )
}
