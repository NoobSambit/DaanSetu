'use client'

import { useState } from 'react'
import Link from 'next/link'

interface NGORecommendation {
  ngo_id: string
  ngo_name: string
  reason: string
  category: string
}

interface AIRecommendationsProps {
  userId: string
}

export default function AIRecommendations({ userId }: AIRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<NGORecommendation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecommendations = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/recommend-ngos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations')
      }

      const data = await response.json()
      setRecommendations(data.recommendations || [])
    } catch (err) {
      setError('Unable to load recommendations. Please try again.')
      console.error('Error fetching recommendations:', err)
    } finally {
      setLoading(false)
    }
  }

  const categoryColors: Record<string, string> = {
    education: 'bg-blue-100 text-blue-800',
    food: 'bg-orange-100 text-orange-800',
    health: 'bg-red-100 text-red-800',
    women: 'bg-purple-100 text-purple-800',
    animals: 'bg-green-100 text-green-800',
  }

  const categoryEmojis: Record<string, string> = {
    education: '📚',
    food: '🍲',
    health: '🏥',
    women: '👩',
    animals: '🐾',
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recommended NGOs for You</h2>
          <p className="text-sm text-gray-600 mt-1">AI-powered suggestions based on your interests</p>
        </div>
        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Loading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Get Recommendations
            </>
          )}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      {recommendations.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <p className="font-medium">Click &quot;Get Recommendations&quot; to discover NGOs perfect for you!</p>
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="space-y-4">
          {recommendations.map((rec, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{rec.ngo_name}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${categoryColors[rec.category] || 'bg-gray-100 text-gray-800'}`}>
                      {categoryEmojis[rec.category]} {rec.category}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-3">{rec.reason}</p>
                  <Link
                    href={`/ngos/${rec.ngo_id}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition"
                  >
                    View NGO
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
