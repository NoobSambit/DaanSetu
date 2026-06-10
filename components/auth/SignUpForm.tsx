'use client'

import { User, Mail, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { useActionState, useState } from 'react'

import { signUpAction } from '@/app/auth/actions'
import { INITIAL_AUTH_STATE } from '@/lib/auth/types'

import { PasswordInput, SubmitButton } from './FormControls'

// Custom SVGs for Account Types
const SupporterIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke={active ? "#2563EB" : "#64748B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 21V19C6 17.8954 6.89543 17 8 17H16C17.1046 17 18 17.8954 18 19V21" stroke={active ? "#2563EB" : "#64748B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 14.5C19.5 15 20 15 20 15C20.5 15 21.5 14.5 21.5 13.5C21.5 12.5 20.5 11.5 20 12.5C19.5 11.5 18.5 12.5 18.5 13.5C18.5 14.5 19 15 19 14.5Z" fill="#EF4444" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)

const NGOIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 21H21" stroke={active ? "#10B981" : "#64748B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M5 21V5C5 4.44772 5.44772 4 6 4H18C18.5523 4 19 4.44772 19 5V21" stroke={active ? "#10B981" : "#64748B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 8H15" stroke={active ? "#10B981" : "#64748B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 12H15" stroke={active ? "#10B981" : "#64748B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M9 16H15" stroke={active ? "#10B981" : "#64748B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M21 14C21 14 20 11.5 18.5 11.5C17 11.5 16 14 16 14C16 14 17 16.5 18.5 16.5C20 16.5 21 14 21 14Z" fill="#F59E0B" stroke="#F59E0B" strokeWidth="1.5" strokeLinejoin="round"/>
  </svg>
)

const CorporateIcon = ({ active }: { active: boolean }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="8" width="18" height="12" rx="2" stroke={active ? "#F97316" : "#64748B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M16 8V6C16 4.89543 15.1046 4 14 4H10C8.89543 4 8 4.89543 8 6V8" stroke={active ? "#F97316" : "#64748B"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18 18H20C21.1046 18 22 17.1046 22 16V14C22 12.8954 21.1046 12 20 12H18" stroke="#F97316" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <rect x="19" y="14" width="2" height="2" fill="#F97316"/>
  </svg>
)

const accountTypes = [
  { value: 'user', label: 'Supporter', Icon: SupporterIcon, description: 'I want to support causes and initiatives.' },
  { value: 'ngo', label: 'NGO', Icon: NGOIcon, description: 'I represent a non-profit organization.' },
  { value: 'corporate', label: 'Corporate', Icon: CorporateIcon, description: 'I represent a corporate or CSR team.' },
] as const

export default function SignUpForm() {
  const [state, formAction] = useActionState(signUpAction, INITIAL_AUTH_STATE)
  const [selectedType, setSelectedType] = useState<string>('user')
  const [password, setPassword] = useState('')

  const getStrength = (pass: string) => {
    if (!pass) return { score: 0, label: '', color: 'bg-slate-200' }
    let score = 0
    if (pass.length > 8) score++
    if (pass.length > 12) score++
    if (/[A-Z]/.test(pass)) score++
    if (/[0-9]/.test(pass)) score++
    if (/[^A-Za-z0-9]/.test(pass)) score++

    if (score <= 2) return { score: 1, label: 'Weak', color: 'bg-red-500' }
    if (score <= 4) return { score: 3, label: 'Good', color: 'bg-yellow-500' }
    return { score: 5, label: 'Strong', color: 'bg-[#10B981]' }
  }

  const strength = getStrength(password)

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-800">
          {state.message}
        </div>
      )}

      <fieldset>
        <legend className="sr-only">Account type</legend>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {accountTypes.map(({ value, label, Icon, description }) => {
            const isActive = selectedType === value
            return (
              <label key={value} className="cursor-pointer relative group">
                <input
                  type="radio"
                  name="accountType"
                  value={value}
                  checked={isActive}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="peer sr-only"
                />
                <div className={`h-[120px] rounded-[14px] border ${isActive ? 'border-[#2563EB] bg-[#EFF6FF]' : 'border-slate-200 bg-white group-hover:border-slate-300'} p-3.5 transition-all duration-200 flex flex-col items-center text-center justify-center`}>
                  {/* Radio indicator inside card at top left */}
                  <div className="absolute top-3 left-3">
                    <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${isActive ? 'border-[#2563EB]' : 'border-slate-300'}`}>
                      {isActive && <div className="h-[8px] w-[8px] rounded-full bg-[#2563EB]" />}
                    </div>
                  </div>
                  
                  <div className={`flex shrink-0 items-center justify-center w-10 h-10 rounded-xl mb-2.5 ${isActive ? 'bg-white shadow-sm' : 'bg-slate-50'}`}>
                    <Icon active={isActive} />
                  </div>
                  
                  <span className={`text-[13px] font-bold leading-none mb-1.5 ${isActive ? 'text-[#1e3a8a]' : 'text-slate-900'}`}>{label}</span>
                  <span className="text-[10px] leading-[1.2] text-slate-500 max-w-[95%]">{description}</span>
                </div>
              </label>
            )
          })}
        </div>
        {state.fieldErrors?.accountType && (
          <p className="mt-1 text-[11px] font-medium text-red-700">{state.fieldErrors.accountType}</p>
        )}
      </fieldset>

      <div>
        <label htmlFor="name" className="mb-1.5 block text-[12px] font-bold text-slate-800">
          Full Name
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <User className="h-4 w-4" strokeWidth={2} />
          </div>
          <input
            id="name"
            name="name"
            type="text"
            placeholder="Enter your full name"
            autoComplete="name"
            required
            maxLength={100}
            autoFocus
            aria-invalid={Boolean(state.fieldErrors?.name)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-[13px] text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]"
          />
        </div>
        {state.fieldErrors?.name && (
          <p className="mt-1 text-[11px] font-medium text-red-700">{state.fieldErrors.name}</p>
        )}
      </div>

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
            placeholder="Enter your email address"
            autoComplete="email"
            inputMode="email"
            required
            aria-invalid={Boolean(state.fieldErrors?.email)}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3.5 text-[13px] text-slate-900 outline-none transition focus:border-[#2563EB] focus:ring-2 focus:ring-blue-100 placeholder:text-slate-400 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.02)]"
          />
        </div>
        {state.fieldErrors?.email && (
          <p className="mt-1 text-[11px] font-medium text-red-700">{state.fieldErrors.email}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <PasswordInput
            id="password"
            name="password"
            label="Password"
            autoComplete="new-password"
            error={state.fieldErrors?.password}
            icon={<Lock className="h-4 w-4" strokeWidth={2} />}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <PasswordInput
          id="confirmPassword"
          name="confirmPassword"
          label="Confirm Password"
          autoComplete="new-password"
          error={state.fieldErrors?.confirmPassword}
          icon={<Lock className="h-4 w-4" strokeWidth={2} />}
        />
      </div>
      
      {/* Visual Password Strength Indicator */}
      <div className="mt-0.5 flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-600">
          Password strength: <span className={strength.score >= 4 ? 'text-[#10B981]' : strength.score >= 2 ? 'text-yellow-500' : 'text-red-500'}>{strength.label}</span>
        </span>
      </div>
      <div className="flex gap-1.5 h-[4px] w-full mt-1.5">
        <div className={`flex-1 rounded-full ${strength.score >= 1 ? strength.color : 'bg-slate-100'}`} />
        <div className={`flex-1 rounded-full ${strength.score >= 2 ? strength.color : 'bg-slate-100'}`} />
        <div className={`flex-1 rounded-full ${strength.score >= 3 ? strength.color : 'bg-slate-100'}`} />
        <div className={`flex-1 rounded-full ${strength.score >= 4 ? strength.color : 'bg-slate-100'}`} />
        <div className={`flex-1 rounded-full ${strength.score >= 5 ? strength.color : 'bg-slate-100'}`} />
      </div>

      <label className="flex items-start gap-2.5 text-[12px] leading-snug text-slate-500 mt-5 cursor-pointer">
        <input
          type="checkbox"
          name="terms"
          value="accepted"
          required
          className="mt-0.5 h-[16px] w-[16px] rounded border-slate-300 text-[#2563EB] focus:ring-[#2563EB]"
        />
        <span>
          I agree to the <Link href="/terms" className="font-bold text-[#2563EB] hover:underline">Terms of Service</Link> and{' '}
          <Link href="/privacy" className="font-bold text-[#2563EB] hover:underline">Privacy Policy</Link>
        </span>
      </label>

      <div className="pt-2">
        <SubmitButton rightIcon={<ArrowRight className="h-4 w-4 ml-1.5" />}>Create Account</SubmitButton>
      </div>

      <p className="text-center text-[12px] text-slate-500 pt-2">
        Already have an account?{' '}
        <Link href="/sign-in" className="font-bold text-[#2563EB] hover:underline">
          Sign In
        </Link>
      </p>
    </form>
  )
}
