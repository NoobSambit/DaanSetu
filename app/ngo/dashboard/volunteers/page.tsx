'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  createVolunteerOpportunity,
  getNGOOpportunities,
  getOpportunityApplications,
  updateApplicationStatus,
  type ApplicationWithDetails,
} from '@/lib/services/volunteer-opportunities'
import { VOLUNTEER_SKILLS } from '@/lib/services/volunteers'
import type { VolunteerOpportunity } from '@/lib/types/database.types'

export default function NGOVolunteerDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [ngoId, setNgoId] = useState<string | null>(null)
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([])
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null)
  const [applications, setApplications] = useState<ApplicationWithDetails[]>([])

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    city: '',
    requiredSkills: [] as string[],
    date: '',
    totalNeeded: 1,
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    checkNGOAuth()
  }, [])

  async function checkNGOAuth() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/sign-in')
      return
    }

    // Get NGO owned by this user
    const { data: ngos } = await supabase
      .from('ngos')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (!ngos || ngos.length === 0) {
      alert('You need to have an NGO to access this page')
      router.push('/dashboard')
      return
    }

    setNgoId(ngos[0].id)
    loadOpportunities(ngos[0].id)
    setLoading(false)
  }

  async function loadOpportunities(ngoId: string) {
    try {
      const data = await getNGOOpportunities(ngoId)
      setOpportunities(data)
    } catch (error) {
      console.error('Failed to load opportunities:', error)
    }
  }

  async function loadApplications(opportunityId: string) {
    try {
      const data = await getOpportunityApplications(opportunityId)
      setApplications(data)
      setSelectedOpportunity(opportunityId)
    } catch (error) {
      console.error('Failed to load applications:', error)
    }
  }

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      requiredSkills: prev.requiredSkills.includes(skill)
        ? prev.requiredSkills.filter((s) => s !== skill)
        : [...prev.requiredSkills, skill],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!ngoId) return

    if (formData.requiredSkills.length === 0) {
      alert('Please select at least one required skill')
      return
    }

    setSubmitting(true)

    try {
      await createVolunteerOpportunity({
        ngoId,
        ...formData,
      })

      alert('Volunteer opportunity created successfully!')
      setShowCreateForm(false)
      setFormData({
        title: '',
        description: '',
        city: '',
        requiredSkills: [],
        date: '',
        totalNeeded: 1,
      })
      loadOpportunities(ngoId)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create opportunity')
    } finally {
      setSubmitting(false)
    }
  }

  const handleApplicationAction = async (applicationId: string, action: 'accepted' | 'rejected') => {
    try {
      await updateApplicationStatus(applicationId, action)
      alert(`Application ${action} successfully!`)

      if (selectedOpportunity) {
        loadApplications(selectedOpportunity)
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update application')
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    }
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'
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
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Volunteer Management
          </h1>
          <p className="text-gray-600">
            Create opportunities and manage volunteer applications
          </p>
        </div>

        {/* Create Opportunity Button */}
        {!showCreateForm && (
          <div className="mb-8">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              + Post Volunteer Opportunity
            </button>
          </div>
        )}

        {/* Create Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Create Volunteer Opportunity
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    required
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="totalNeeded" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Volunteers Needed <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="totalNeeded"
                  value={formData.totalNeeded}
                  onChange={(e) => setFormData({ ...formData, totalNeeded: parseInt(e.target.value) })}
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Required Skills <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {VOLUNTEER_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.requiredSkills.includes(skill)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Creating...' : 'Create Opportunity'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Opportunities List */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Your Opportunities</h2>

          {opportunities.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-600 mb-4">No volunteer opportunities yet</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Create your first opportunity
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {opportunities.map((opportunity) => (
                <div key={opportunity.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          {opportunity.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          📍 {opportunity.city} • 📅 {formatDate(opportunity.date)} • 👥 {opportunity.total_needed} needed
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        opportunity.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {opportunity.status}
                      </span>
                    </div>

                    <p className="text-gray-700 mb-4">{opportunity.description}</p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {opportunity.required_skills.map((skill) => (
                        <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {skill}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => loadApplications(opportunity.id)}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                    >
                      View Applications →
                    </button>
                  </div>

                  {/* Applications */}
                  {selectedOpportunity === opportunity.id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">
                        Applications ({applications.length})
                      </h4>

                      {applications.length === 0 ? (
                        <p className="text-gray-600">No applications yet</p>
                      ) : (
                        <div className="space-y-4">
                          {applications.map((application) => (
                            <div key={application.id} className="bg-white p-4 rounded-lg">
                              <div className="flex justify-between items-start mb-2">
                                <div>
                                  <p className="font-medium text-gray-900">{application.user.name}</p>
                                  <p className="text-sm text-gray-600">{application.user.email}</p>
                                  {application.volunteer_profile && (
                                    <div className="mt-2">
                                      <p className="text-sm text-gray-700">📍 {application.volunteer_profile.city}</p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {application.volunteer_profile.skills.map((skill) => (
                                          <span key={skill} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded">
                                            {skill}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(application.status)}`}>
                                  {application.status}
                                </span>
                              </div>

                              {application.status === 'pending' && (
                                <div className="flex gap-2 mt-3">
                                  <button
                                    onClick={() => handleApplicationAction(application.id, 'accepted')}
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                                  >
                                    Accept
                                  </button>
                                  <button
                                    onClick={() => handleApplicationAction(application.id, 'rejected')}
                                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                                  >
                                    Reject
                                  </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
