'use client'

import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import type { ChangeEventHandler } from 'react'
import { useState } from 'react'
import { useFormStatus } from 'react-dom'

export function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  error,
  hint,
  hideLabel = false,
  icon,
  onChange,
}: {
  id: string
  name: string
  label: string
  autoComplete: string
  error?: string
  hint?: string
  hideLabel?: boolean
  icon?: React.ReactNode
  onChange?: ChangeEventHandler<HTMLInputElement>
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label
        htmlFor={id}
        className={hideLabel ? 'sr-only' : 'mb-1.5 block text-[12px] font-bold text-slate-800'}
      >
        {label}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          onChange={onChange}
          required
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : hint ? `${id}-hint` : undefined}
          className={`w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-11 text-[13px] text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)] ${icon ? 'pl-10' : 'pl-3.5'}`}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-slate-400 hover:text-slate-600"
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-[11px] font-medium text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-[11px] text-slate-500">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function SubmitButton({ children, rightIcon }: { children: React.ReactNode, rightIcon?: React.ReactNode }) {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F52BA] px-4 py-3 text-[14px] font-bold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-65 shadow-sm"
    >
      {pending && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />}
      {pending ? 'Please wait...' : children}
      {!pending && rightIcon}
    </button>
  )
}
