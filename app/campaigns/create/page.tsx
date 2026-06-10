'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { createCampaign } from '@/lib/services/campaigns'
import type { CampaignCategory } from '@/lib/types/database.types'

export default function CreateCampaignPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userNGOs, setUserNGOs] = useState<any[]>([])

  const [formData, setFormData] = useState({
    ngoId: '',
    title: '',
    shortDescription: '',
    description: '',
    goalAmount: '',
    deadline: '',
    imageUrl: '',
    category: 'education' as CampaignCategory,
  })

  useEffect(() => {
    checkPermissionsAndLoadNGOs()
  }, [])

  const checkPermissionsAndLoadNGOs = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/sign-in?next=/campaigns/create')
      return
    }

    // Get user's NGOs
    const { data: ngos, error: ngosError } = await supabase
      .from('ngos')
      .select('*')
      .eq('user_id', user.id)
      .eq('profile_status', 'published')

    if (ngosError) {
      setError('Failed to load your NGOs')
      setLoading(false)
      return
    }

    if (!ngos || ngos.length === 0) {
      setError('Publish your NGO profile before creating a campaign')
      setLoading(false)
      return
    }

    setUserNGOs(ngos)
    setFormData((prev) => ({ ...prev, ngoId: ngos[0].id }))
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.title || !formData.shortDescription || !formData.description) {
      setError('Please fill in all required fields')
      return
    }

    const goalAmount = parseFloat(formData.goalAmount)
    if (!goalAmount || goalAmount <= 0) {
      setError('Please enter a valid goal amount')
      return
    }

    if (!formData.deadline) {
      setError('Please select a deadline')
      return
    }

    // Check deadline is in the future
    const deadlineDate = new Date(formData.deadline)
    if (deadlineDate <= new Date()) {
      setError('Deadline must be in the future')
      return
    }

    setSubmitting(true)

    try {
      const campaign = await createCampaign({
        ngoId: formData.ngoId,
        title: formData.title,
        shortDescription: formData.shortDescription,
        description: formData.description,
        goalAmount,
        deadline: new Date(formData.deadline).toISOString(),
        imageUrl: formData.imageUrl || undefined,
        category: formData.category,
      })

      router.push(`/campaigns/${campaign.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign')
      setSubmitting(false)
    }
  }

  const categories: { value: CampaignCategory; label: string; emoji: string }[] = [
    { value: 'education', label: 'Education', emoji: '📚' },
    { value: 'food', label: 'Food', emoji: '🍲' },
    { value: 'health', label: 'Health', emoji: '🏥' },
    { value: 'women', label: 'Women', emoji: '👩' },
    { value: 'animals', label: 'Animals', emoji: '🐾' },
    { value: 'disaster', label: 'Disaster Relief', emoji: '🆘' },
  ]

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (error && userNGOs.length === 0) {
    return (
      <div className="min-h-[calc(100vh-4rem)] bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/ngos')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Browse NGOs
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Campaign</h1>
        <p className="text-gray-600 mb-8">Launch a campaign to raise funds for your cause</p>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          {/* NGO Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Select NGO <span className="text-red-600">*</span>
            </label>
            <select
              value={formData.ngoId}
              onChange={(e) => setFormData({ ...formData, ngoId: e.target.value })}
              required
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
            >
              {userNGOs.map((ngo) => (
                <option key={ngo.id} value={ngo.id}>
                  {ngo.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Campaign Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Winter Blanket Drive 2024"
              required
              maxLength={100}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Short Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Short Description <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              placeholder="One-line summary of your campaign"
              required
              maxLength={200}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
            />
            <p className="text-sm text-gray-500 mt-1">{formData.shortDescription.length}/200</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Detailed Description <span className="text-red-600">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Explain your campaign goals, how funds will be used, and why people should support it..."
              required
              rows={8}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Goal Amount */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Fundraising Goal (₹) <span className="text-red-600">*</span>
            </label>
            <input
              type="number"
              value={formData.goalAmount}
              onChange={(e) => setFormData({ ...formData, goalAmount: e.target.value })}
              placeholder="50000"
              required
              min="100"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Campaign Deadline <span className="text-red-600">*</span>
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              Category <span className="text-red-600">*</span>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: cat.value })}
                  className={`py-3 px-4 rounded-lg border-2 font-medium transition ${
                    formData.category === cat.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image URL (Optional) */}
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Cover Image URL (Optional)
            </label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
            />
            <p className="text-sm text-gray-500 mt-1">
              Recommended: 1200x600px image
            </p>
          </div>

          {/* Error Message */}
          {error && userNGOs.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              disabled={submitting}
              className="flex-1 py-3 px-6 border-2 border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-3 px-6 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {submitting ? 'Creating Campaign...' : 'Create Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
