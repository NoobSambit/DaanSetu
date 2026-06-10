import { randomUUID } from 'node:crypto'

import { NextRequest, NextResponse } from 'next/server'

import { getUserRole } from '@/lib/auth/profile'
import { rateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit'
import { createClient } from '@/lib/supabase/server'

const allowedTypes = new Map([
  ['image/jpeg', 'jpg'],
  ['image/png', 'png'],
  ['image/webp', 'webp'],
])

async function handler(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || (await getUserRole(supabase, user.id)) !== 'ngo') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  const assetType = formData.get('assetType')
  if (!(file instanceof File) || (assetType !== 'logo' && assetType !== 'cover')) {
    return NextResponse.json({ error: 'A valid image and asset type are required.' }, { status: 400 })
  }

  const extension = allowedTypes.get(file.type)
  if (!extension || !['jpg', 'jpeg', 'png', 'webp'].includes(file.name.toLowerCase().split('.').pop() ?? '')) {
    return NextResponse.json({ error: 'Upload a JPEG, PNG, or WebP image.' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image size must not exceed 5 MB.' }, { status: 400 })
  }

  const path = `${user.id}/${assetType}/${randomUUID()}.${extension}`
  const { error } = await supabase.storage.from('ngos').upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: false,
  })
  if (error) return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 })

  const { data } = supabase.storage.from('ngos').getPublicUrl(path)
  return NextResponse.json({ path, url: data.publicUrl })
}

export const POST = rateLimit(RATE_LIMITS.UPLOAD)(handler)

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json().catch(() => ({}))
  const path = typeof body.path === 'string' ? body.path : ''
  if (!path.startsWith(`${user.id}/`)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const { error } = await supabase.storage.from('ngos').remove([path])
  return error
    ? NextResponse.json({ error: 'Image deletion failed.' }, { status: 500 })
    : NextResponse.json({ success: true })
}

