'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getCampaignUpdates, createCampaignUpdate } from '@/lib/services/campaigns'
import { createClient } from '@/lib/supabase/client'
import type { CampaignUpdate } from '@/lib/types/database.types'

interface CampaignUpdatesProps {
  campaignId: string
  ngoId: string
}

export default function CampaignUpdates({ campaignId, ngoId }: CampaignUpdatesProps) {
  const router = useRouter()
  const [updates, setUpdates] = useState<CampaignUpdate[]>([])
  const [loading, setLoading] = useState(true)
  const [canPost, setCanPost] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [newUpdate, setNewUpdate] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    loadUpdates()
    checkPermissions()
  }, [campaignId])

  const loadUpdates = async () => {
    try {
      const data = await getCampaignUpdates(campaignId)
      setUpdates(data)
    } catch (error) {
      console.error('Failed to load updates:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkPermissions = async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setCanPost(false)
      return
    }

    // Check if user owns the NGO
    const { data: ngo } = await supabase
      .from('ngos')
      .select('user_id')
      .eq('id', ngoId)
      .single()

    setCanPost(ngo?.user_id === user.id)
  }

  const handlePostUpdate = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newUpdate.trim()) return

    setPosting(true)
    try {
      await createCampaignUpdate(campaignId, newUpdate.trim())
      setNewUpdate('')
      setShowForm(false)
      await loadUpdates()
    } catch (error) {
      console.error('Failed to post update:', error)
      alert('Failed to post update')
    } finally {
      setPosting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-900">
          Campaign Updates ({updates.length})
        </h3>
        {canPost && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Post Update
          </button>
        )}
      </div>

      {/* Post Update Form */}
      {canPost && showForm && (
        <form onSubmit={handlePostUpdate} className="mb-6 border-2 border-blue-200 rounded-lg p-4">
          <textarea
            value={newUpdate}
            onChange={(e) => setNewUpdate(e.target.value)}
            placeholder="Share an update about this campaign..."
            rows={4}
            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none mb-3"
            disabled={posting}
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={posting || !newUpdate.trim()}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {posting ? 'Posting...' : 'Post Update'}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowForm(false)
                setNewUpdate('')
              }}
              disabled={posting}
              className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Updates List */}
      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : updates.length === 0 ? (
        <p className="text-gray-600 text-center py-8">No updates yet</p>
      ) : (
        <div className="space-y-6 max-h-96 overflow-y-auto">
          {updates.map((update) => (
            <div key={update.id} className="border-b pb-6 last:border-b-0">
              <p className="text-sm text-gray-500 mb-2">
                {new Date(update.created_at).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{update.text}</p>
              {update.image_url && (
                <img
                  src={update.image_url}
                  alt="Update"
                  className="mt-3 rounded-lg max-w-full"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
