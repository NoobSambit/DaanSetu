'use client'

import { useFormState } from 'react-dom'

import {
  createNgoProfileAction,
  INITIAL_NGO_PROFILE_STATE,
} from '@/app/ngo/profile/actions'

import { SubmitButton } from './FormControls'

const fieldClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3.5 py-3 text-sm text-slate-950 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100'
const labelClass = 'mb-2 block text-sm font-semibold text-slate-800'

export default function NgoProfileForm() {
  const [state, formAction] = useFormState(
    createNgoProfileAction,
    INITIAL_NGO_PROFILE_STATE
  )

  return (
    <form action={formAction} className="space-y-5">
      {state.message && (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {state.message}
        </div>
      )}

      <div>
        <label htmlFor="name" className={labelClass}>Registered NGO name</label>
        <input id="name" name="name" required maxLength={150} className={fieldClass} />
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>About the organization</label>
        <textarea
          id="description"
          name="description"
          required
          minLength={40}
          maxLength={1200}
          rows={5}
          className={fieldClass}
        />
        <p className="mt-1.5 text-xs text-slate-500">At least 40 characters.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="city" className={labelClass}>City</label>
          <input id="city" name="city" required maxLength={100} className={fieldClass} />
        </div>
        <div>
          <label htmlFor="state" className={labelClass}>State</label>
          <input id="state" name="state" required maxLength={100} className={fieldClass} />
        </div>
      </div>

      <div>
        <label htmlFor="category" className={labelClass}>Primary cause</label>
        <select id="category" name="category" required className={fieldClass} defaultValue="">
          <option value="" disabled>Select a cause</option>
          <option value="education">Education</option>
          <option value="food">Food and hunger</option>
          <option value="health">Health</option>
          <option value="women">Women&apos;s empowerment</option>
          <option value="animals">Animal welfare</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="latitude" className={labelClass}>Latitude</label>
          <input id="latitude" name="latitude" type="number" step="any" min="-90" max="90" required className={fieldClass} />
        </div>
        <div>
          <label htmlFor="longitude" className={labelClass}>Longitude</label>
          <input id="longitude" name="longitude" type="number" step="any" min="-180" max="180" required className={fieldClass} />
        </div>
      </div>
      <p className="-mt-3 text-xs text-slate-500">
        Coordinates place your organization correctly on the public NGO map.
      </p>

      <SubmitButton>Create NGO profile</SubmitButton>
    </form>
  )
}
