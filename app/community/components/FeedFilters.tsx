'use client'

import { useState } from 'react'
import type { PostCategory, PostAuthorRole } from '@/lib/types/database.types'

interface FeedFiltersProps {
  onFilterChange: (filters: {
    category?: PostCategory
    authorRole?: PostAuthorRole
    search?: string
  }) => void
}

export default function FeedFilters({ onFilterChange }: FeedFiltersProps) {
  const [category, setCategory] = useState<PostCategory | ''>('')
  const [authorRole, setAuthorRole] = useState<PostAuthorRole | ''>('')
  const [search, setSearch] = useState('')

  const handleFilterChange = (
    newCategory?: PostCategory | '',
    newAuthorRole?: PostAuthorRole | '',
    newSearch?: string
  ) => {
    const filters: any = {}

    const cat = newCategory !== undefined ? newCategory : category
    const role = newAuthorRole !== undefined ? newAuthorRole : authorRole
    const searchTerm = newSearch !== undefined ? newSearch : search

    if (cat) filters.category = cat
    if (role) filters.authorRole = role
    if (searchTerm) filters.search = searchTerm

    onFilterChange(filters)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Search
          </label>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              handleFilterChange(undefined, undefined, e.target.value)
            }}
            placeholder="Search posts..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => {
              const value = e.target.value as PostCategory | ''
              setCategory(value)
              handleFilterChange(value, undefined, undefined)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            <option value="update">Updates</option>
            <option value="story">Success Stories</option>
            <option value="announcement">Announcements</option>
          </select>
        </div>

        {/* Author Role Filter */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Posted By
          </label>
          <select
            value={authorRole}
            onChange={(e) => {
              const value = e.target.value as PostAuthorRole | ''
              setAuthorRole(value)
              handleFilterChange(undefined, value, undefined)
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Everyone</option>
            <option value="ngo">NGOs</option>
            <option value="corporate">Corporates</option>
            <option value="admin">Admins</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {(category || authorRole || search) && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-600">Active filters:</span>

          {category && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {category === 'update' ? 'Updates' : category === 'story' ? 'Success Stories' : 'Announcements'}
              <button
                onClick={() => {
                  setCategory('')
                  handleFilterChange('', undefined, undefined)
                }}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          )}

          {authorRole && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
              {authorRole === 'ngo' ? 'NGOs' : authorRole === 'corporate' ? 'Corporates' : 'Admins'}
              <button
                onClick={() => {
                  setAuthorRole('')
                  handleFilterChange(undefined, '', undefined)
                }}
                className="text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          )}

          {search && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
              &quot;{search}&quot;
              <button
                onClick={() => {
                  setSearch('')
                  handleFilterChange(undefined, undefined, '')
                }}
                className="text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          )}

          <button
            onClick={() => {
              setCategory('')
              setAuthorRole('')
              setSearch('')
              onFilterChange({})
            }}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
