'use client'

import { Building2, HeartHandshake, UserRound } from 'lucide-react'
import Link from 'next/link'
import { useFormState } from 'react-dom'

import { signUpAction } from '@/app/auth/actions'
import { INITIAL_AUTH_STATE } from '@/lib/auth/types'

import { PasswordInput, SubmitButton } from './FormControls'

const accountTypes = [
  { value: 'user', label: 'Supporter', icon: UserRound, description: 'Donate and volunteer' },
  { value: 'ngo', label: 'NGO', icon: HeartHandshake, description: 'Raise and organize' },
  { value: 'corporate', label: 'Corporate', icon: Building2, description: 'Manage CSR impact' },
] as const

export default function SignUpForm() {
  const [state, formAction] = useFormState(signUpAction, INITIAL_AUTH_STATE)

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      )}

      <fieldset>
        <legend className="mb-2 text-sm font-semibold text-slate-800">Account type</legend>
        <div className="grid grid-cols-3 gap-2">
          {accountTypes.map(({ value, label, icon: Icon, description }) => (
            <label key={value} className="cursor-pointer">
              <input
                type="radio"
                name="accountType"
                value={value}
                defaultChecked={value === 'user'}
                className="peer sr-only"
              />
              <span className="flex min-h-24 flex-col items-center justify-center rounded-lg border border-slate-300 px-2 py-3 text-center transition peer-checked:border-blue-600 peer-checked:bg-blue-50 peer-checked:ring-1 peer-checked:ring-blue-600">
                <Icon className="mb-1.5 h-5 w-5 text-slate-600 peer-checked:text-blue-700" aria-hidden="true" />
                <span className="text-xs font-bold text-slate-900">{label}</span>
                <span className="mt-0.5 text-[10px] leading-4 text-slate-500">{description}</span>
              </span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.accountType && (
          <p className="mt-1.5 text-xs font-medium text-red-700">{state.fieldErrors.accountType}</p>
        )}
      </fieldset>

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-semibold text-slate-800">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          required
          maxLength={100}
          autoFocus
          aria-invalid={Boolean(state.fieldErrors?.name)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        {state.fieldErrors?.name && (
          <p className="mt-1.5 text-xs font-medium text-red-700">{state.fieldErrors.name}</p>
        )}
      </div>

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
          aria-invalid={Boolean(state.fieldErrors?.email)}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        {state.fieldErrors?.email && (
          <p className="mt-1.5 text-xs font-medium text-red-700">{state.fieldErrors.email}</p>
        )}
      </div>

      <PasswordInput
        id="password"
        name="password"
        label="Password"
        autoComplete="new-password"
        error={state.fieldErrors?.password}
        hint="Use 12+ characters with uppercase, lowercase, a number, and a symbol."
      />

      <PasswordInput
        id="confirmPassword"
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        error={state.fieldErrors?.confirmPassword}
      />

      <label className="flex items-start gap-3 text-xs leading-5 text-slate-600">
        <input
          type="checkbox"
          name="terms"
          value="accepted"
          required
          className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
        />
        <span>
          I agree to the <Link href="/terms" className="font-semibold text-blue-700">Terms</Link> and{' '}
          <Link href="/privacy" className="font-semibold text-blue-700">Privacy Policy</Link>.
        </span>
      </label>

      <SubmitButton>Create account</SubmitButton>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-semibold text-blue-700 hover:text-blue-800">
          Sign in
        </Link>
      </p>
    </form>
  )
}
