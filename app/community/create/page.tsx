import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import CreatePostForm from './CreatePostForm'

export default async function CreatePostPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Get user role
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  const userRole = userData?.role || 'user'

  // Only NGO, Corporate, and Admin can create posts
  if (!['ngo', 'corporate', 'admin'].includes(userRole)) {
    redirect('/community')
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create a Post</h1>
          <p className="text-gray-600">
            Share updates, stories, or announcements with the community
          </p>
        </div>

        <CreatePostForm userId={user.id} userRole={userRole} />
      </div>
    </div>
  )
}
