'use server'

import { redirect } from 'next/navigation'

import { getUserRole } from '@/lib/auth/profile'
import { createClient } from '@/lib/supabase/server'

export interface NgoProfileState {
  status: 'idle' | 'error'
  message?: string
}

export const INITIAL_NGO_PROFILE_STATE: NgoProfileState = {
  status: 'idle',
}

function readString(formData: FormData, key: string): string {
  const value = formData.get(key)
  return typeof value === 'string' ? value.trim() : ''
}

export async function createNgoProfileAction(
  _previousState: NgoProfileState,
  formData: FormData
): Promise<NgoProfileState> {
  const name = readString(formData, 'name')
  const description = readString(formData, 'description')
  const city = readString(formData, 'city')
  const state = readString(formData, 'state')
  const category = readString(formData, 'category')
  const latitude = Number(readString(formData, 'latitude'))
  const longitude = Number(readString(formData, 'longitude'))
  const allowedCategories = ['education', 'food', 'health', 'women', 'animals']

  if (
    name.length < 2 ||
    description.length < 40 ||
    !city ||
    !state ||
    !allowedCategories.includes(category) ||
    !Number.isFinite(latitude) ||
    latitude < -90 ||
    latitude > 90 ||
    !Number.isFinite(longitude) ||
    longitude < -180 ||
    longitude > 180
  ) {
    return {
      status: 'error',
      message: 'Complete all fields with valid organization and location details.',
    }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || (await getUserRole(supabase, user.id)) !== 'ngo') {
    return {
      status: 'error',
      message: 'You need an NGO account to create this profile.',
    }
  }

  const { error } = await supabase.from('ngos').insert({
    name,
    description,
    city,
    state,
    category,
    latitude,
    longitude,
    user_id: user.id,
  })

  if (error) {
    return {
      status: 'error',
      message: 'Your NGO profile could not be created. Please review the details and try again.',
    }
  }

  redirect('/ngo/dashboard/analytics')
}
