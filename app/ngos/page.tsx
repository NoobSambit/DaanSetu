import { createClient } from '@/lib/supabase/server'
import NGOList from '@/components/NGOList'
import SearchFilters from '@/components/SearchFilters'

export const dynamic = 'force-dynamic'

export default async function NGOsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; city?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Build query
  let query = supabase
    .from('ngos')
    .select('*')
    .order('created_at', { ascending: false })

  // Apply filters
  if (params.category) {
    query = query.eq('category', params.category)
  }

  if (params.city) {
    query = query.ilike('city', `%${params.city}%`)
  }

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
  }

  const { data: ngos, error } = await query

  if (error) {
    console.error('Error fetching NGOs:', error)
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Discover NGOs</h1>
          <p className="text-gray-600">
            Find and connect with organizations making a difference
          </p>
        </div>

        <SearchFilters />

        <div className="mt-8">
          {ngos && ngos.length > 0 ? (
            <>
              <p className="text-sm text-gray-600 mb-4">
                Found {ngos.length} {ngos.length === 1 ? 'NGO' : 'NGOs'}
              </p>
              <NGOList ngos={ngos} />
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No NGOs Found
              </h3>
              <p className="text-gray-600">
                Try adjusting your search filters or check back later
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
