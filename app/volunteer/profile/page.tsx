'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  getVolunteerProfile,
  createVolunteerProfile,
  updateVolunteerProfile,
  VOLUNTEER_SKILLS,
  VOLUNTEER_AVAILABILITY,
} from '@/lib/services/volunteers'
import type { VolunteerProfile } from '@/lib/types/database.types'

export default function VolunteerProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<VolunteerProfile | null>(null)
  const [formData, setFormData] = useState({
    bio: '',
    city: '',
    skills: [] as string[],
    availability: [] as string[],
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/auth/login')
      return
    }

    // Load existing profile
    const existingProfile = await getVolunteerProfile()
    if (existingProfile) {
      setProfile(existingProfile)
      setFormData({
        bio: existingProfile.bio || '',
        city: existingProfile.city,
        skills: existingProfile.skills,
        availability: existingProfile.availability,
      })
    }

    setLoading(false)
  }

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }))
  }

  const handleAvailabilityToggle = (availability: string) => {
    setFormData((prev) => ({
      ...prev,
      availability: prev.availability.includes(availability)
        ? prev.availability.filter((a) => a !== availability)
        : [...prev.availability, availability],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!formData.city.trim()) {
      setError('Please enter your city')
      return
    }

    if (formData.skills.length === 0) {
      setError('Please select at least one skill')
      return
    }

    if (formData.availability.length === 0) {
      setError('Please select your availability')
      return
    }

    setSaving(true)

    try {
      if (profile) {
        await updateVolunteerProfile(formData)
        setSuccess('Profile updated successfully!')
      } else {
        const newProfile = await createVolunteerProfile(formData)
        setProfile(newProfile)
        setSuccess('Profile created successfully!')
      }

      setTimeout(() => {
        router.push('/volunteer/opportunities')
      }, 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {profile ? 'Edit Volunteer Profile' : 'Create Volunteer Profile'}
          </h1>
          <p className="text-gray-600 mb-8">
            Complete your profile to start volunteering with NGOs
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Bio */}
            <div>
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
                About You
              </label>
              <textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell NGOs about yourself and why you want to volunteer..."
              />
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Mumbai, Delhi, Bangalore"
                required
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Skills <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {VOLUNTEER_SKILLS.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.skills.includes(skill)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {skill}
                  </button>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Availability <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {VOLUNTEER_AVAILABILITY.map((availability) => (
                  <button
                    key={availability}
                    type="button"
                    onClick={() => handleAvailabilityToggle(availability)}
                    className={`px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      formData.availability.includes(availability)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {availability}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : profile ? 'Update Profile' : 'Create Profile'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
