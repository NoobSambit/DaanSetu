'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getAllCampaigns, type CampaignWithNGO } from '@/lib/services/campaigns'
import type { CampaignCategory } from '@/lib/types/database.types'
import AICampaignSuggestions from './components/AICampaignSuggestions'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignWithNGO[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<CampaignCategory | undefined>()
  const [sortBy, setSortBy] = useState<'deadline' | 'created_at' | 'current_amount'>('created_at')

  useEffect(() => {
    loadCampaigns()
  }, [selectedCategory, sortBy])

  const loadCampaigns = async () => {
    try {
      setLoading(true)
      const data = await getAllCampaigns({
        category: selectedCategory,
        sortBy,
        status: 'active',
      })
      setCampaigns(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }

  const categoryEmojis: Record<CampaignCategory, string> = {
    education: '📚',
    food: '🍲',
    health: '🏥',
    women: '👩',
    animals: '🐾',
    disaster: '🆘',
  }

  const categories: { value: CampaignCategory; label: string }[] = [
    { value: 'education', label: 'Education' },
    { value: 'food', label: 'Food' },
    { value: 'health', label: 'Health' },
    { value: 'women', label: 'Women' },
    { value: 'animals', label: 'Animals' },
    { value: 'disaster', label: 'Disaster' },
  ]

  const getProgressPercentage = (current: number, goal: number) => {
    return Math.min((current / goal) * 100, 100)
  }

  const getDaysRemaining = (deadline: string) => {
    const today = new Date()
    const endDate = new Date(deadline)
    const diffTime = endDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Active Campaigns</h1>
          <p className="text-gray-600">Support NGO campaigns and make a difference</p>
        </div>

        {/* AI Campaign Suggestions */}
        <AICampaignSuggestions />

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">
                Filter by Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className={`px-4 py-2 rounded-lg border-2 font-medium transition ${
                    selectedCategory === undefined
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-2 rounded-lg border-2 font-medium transition ${
                      selectedCategory === cat.value
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                    }`}
                  >
                    {categoryEmojis[cat.value]} {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sort Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-3">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none"
              >
                <option value="created_at">Newly Launched</option>
                <option value="deadline">Ending Soon</option>
                <option value="current_amount">Highest Funded</option>
              </select>
            </div>
          </div>
        </div>

        {/* Campaign Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading campaigns...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-red-600">{error}</p>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-lg text-gray-600">No active campaigns found</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => {
              const progress = getProgressPercentage(campaign.current_amount, campaign.goal_amount)
              const daysRemaining = getDaysRemaining(campaign.deadline)

              return (
                <Link
                  key={campaign.id}
                  href={`/campaigns/${campaign.id}`}
                  className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  {/* Campaign Image */}
                  <div className="relative h-48 bg-gray-200">
                    {campaign.image_url ? (
                      <img
                        src={campaign.image_url}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <span className="text-6xl">{categoryEmojis[campaign.category]}</span>
                      </div>
                    )}
                    {/* Category Badge */}
                    <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-semibold">
                      {categoryEmojis[campaign.category]} {campaign.category}
                    </div>
                  </div>

                  {/* Campaign Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {campaign.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {campaign.short_description}
                    </p>

                    {/* NGO Name */}
                    <p className="text-sm text-blue-600 mb-4">
                      by {campaign.ngos.name}
                    </p>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-900">
                          ₹{campaign.current_amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-gray-600">
                          of ₹{campaign.goal_amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{progress.toFixed(0)}% funded</span>
                      <span>
                        {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ended'}
                      </span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
