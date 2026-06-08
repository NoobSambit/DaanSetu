'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getCorporateProfile } from '@/lib/services/corporate'
import { createCorporateCampaign, CORPORATE_CAMPAIGN_CAUSES } from '@/lib/services/corporate-campaigns'
import type { CorporateCampaignCause } from '@/lib/types/database.types'

export default function CreateCorporateCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [corporateId, setCorporateId] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    cause: '' as CorporateCampaignCause | '',
    goalAmount: '',
    deadline: '',
    imageUrl: '',
  })

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/sign-in')
        return
      }

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'corporate') {
        router.push('/dashboard')
        return
      }

      const profile = await getCorporateProfile()
      if (!profile) {
        router.push('/corporate/profile')
        return
      }

      setCorporateId(profile.id)
    } catch (error) {
      console.error('Error checking auth:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      if (!formData.cause) {
        throw new Error('Please select a cause')
      }

      const goalAmount = parseFloat(formData.goalAmount)
      if (isNaN(goalAmount) || goalAmount <= 0) {
        throw new Error('Please enter a valid goal amount')
      }

      const campaign = await createCorporateCampaign({
        corporateId,
        title: formData.title,
        description: formData.description,
        cause: formData.cause,
        goalAmount,
        deadline: formData.deadline,
        imageUrl: formData.imageUrl,
      })

      router.push(`/corporate/campaigns/${campaign.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const minDate = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create CSR Campaign</h1>
          <p className="text-gray-600 mb-8">
            Launch a new corporate social responsibility campaign to make an impact
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title *
              </label>
              <input
                type="text"
                id="title"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter campaign title"
                maxLength={100}
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                required
                rows={6}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe your CSR campaign and its impact"
              />
            </div>

            <div>
              <label htmlFor="cause" className="block text-sm font-medium text-gray-700 mb-2">
                Cause *
              </label>
              <select
                id="cause"
                required
                value={formData.cause}
                onChange={(e) => setFormData({ ...formData, cause: e.target.value as CorporateCampaignCause })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a cause</option>
                {CORPORATE_CAMPAIGN_CAUSES.map((cause) => (
                  <option key={cause} value={cause}>
                    {cause.charAt(0).toUpperCase() + cause.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="goalAmount" className="block text-sm font-medium text-gray-700 mb-2">
                Goal Amount (₹) *
              </label>
              <input
                type="number"
                id="goalAmount"
                required
                min="1"
                step="0.01"
                value={formData.goalAmount}
                onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter goal amount"
              />
            </div>

            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Deadline *
              </label>
              <input
                type="date"
                id="deadline"
                required
                min={minDate}
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Cover Image URL
              </label>
              <input
                type="url"
                id="imageUrl"
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/image.jpg"
              />
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="mt-3 w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              )}
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Campaign'}
              </button>
              <button
                type="button"
                onClick={() => router.push('/corporate/campaigns')}
                className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
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
