'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect } from 'react'

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'education', label: '📚 Education' },
  { value: 'food', label: '🍲 Food' },
  { value: 'health', label: '🏥 Health' },
  { value: 'women', label: '👩 Women' },
  { value: 'animals', label: '🐾 Animals' },
]

export default function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [category, setCategory] = useState(searchParams.get('category') || '')
  const [city, setCity] = useState(searchParams.get('city') || '')

  useEffect(() => {
    const params = new URLSearchParams()

    if (search) params.set('search', search)
    if (category) params.set('category', category)
    if (city) params.set('city', city)

    const queryString = params.toString()
    router.push(`/ngos${queryString ? `?${queryString}` : ''}`)
  }, [search, category, city, router])

  const handleReset = () => {
    setSearch('')
    setCategory('')
    setCity('')
  }

  return (
    <div className="card p-6 animate-fade-in">
      <div className="grid md:grid-cols-4 gap-4">
        {/* Search */}
        <div>
          <label htmlFor="search" className="block text-sm font-semibold text-slate-900 mb-2">
            Search
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              id="search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search NGOs..."
              className="input pl-10"
            />
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className="block text-sm font-semibold text-slate-900 mb-2">
            Category
          </label>
          <select
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {categories.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>

        {/* City */}
        <div>
          <label htmlFor="city" className="block text-sm font-semibold text-slate-900 mb-2">
            City
          </label>
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <input
              id="city"
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Mumbai"
              className="input pl-10"
            />
          </div>
        </div>

        {/* Reset Button */}
        <div className="flex items-end">
          <button
            onClick={handleReset}
            className="btn btn-secondary w-full"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  )
}
