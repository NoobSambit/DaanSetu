import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import NGOMap from '@/components/NGOMap'
import type { NGO, NGOCategory } from '@/lib/types/database.types'

export const dynamic = 'force-dynamic'

export default async function NGOProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('ngos')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    notFound()
  }

  const ngo = data as NGO

  const categoryEmojis: Record<NGOCategory, string> = {
    education: '📚',
    food: '🍲',
    health: '🏥',
    women: '👩',
    animals: '🐾',
  }

  const categoryColors: Record<NGOCategory, string> = {
    education: 'bg-blue-100 text-blue-800',
    food: 'bg-green-100 text-green-800',
    health: 'bg-red-100 text-red-800',
    women: 'bg-purple-100 text-purple-800',
    animals: 'bg-orange-100 text-orange-800',
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link href="/ngos" className="text-blue-600 hover:text-blue-700 text-sm">
            ← Back to NGOs
          </Link>
        </div>

        {/* NGO Header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{ngo.name}</h1>
              <div className="flex items-center gap-4 text-gray-600">
                <span className="flex items-center">
                  <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {ngo.city}, {ngo.state}
                </span>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold ${categoryColors[ngo.category]}`}>
              {categoryEmojis[ngo.category]} {ngo.category.charAt(0).toUpperCase() + ngo.category.slice(1)}
            </span>
          </div>

          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{ngo.description}</p>
          </div>
        </div>

        {/* Location Map */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Location</h2>
          <div className="h-96 rounded-lg overflow-hidden">
            <NGOMap ngos={[ngo]} center={[ngo.latitude, ngo.longitude]} zoom={13} />
          </div>
        </div>
      </div>
    </div>
  )
}
