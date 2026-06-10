import { createClient } from '@/lib/supabase/server'
import NGOMap from '@/components/NGOMap'

export const dynamic = 'force-dynamic'

export default async function MapPage() {
  const supabase = await createClient()

  const { data: ngos, error } = await supabase
    .from('ngos')
    .select('*')
    .eq('profile_status', 'published')
    .eq('is_discoverable', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching NGOs:', error)
  }

  return (
    <div className="h-[calc(100vh-4rem)]">
      <NGOMap ngos={ngos || []} />
    </div>
  )
}
