import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { rateLimit, RATE_LIMITS } from '@/lib/middleware/rate-limit'

/**
 * Upload image to Supabase Storage
 * POST /api/upload/image
 *
 * Accepts multipart/form-data with:
 * - file: The image file
 * - bucket: The storage bucket name (campaigns, ngos, posts, profiles)
 * - folder: Optional folder within the bucket
 */
async function handler(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const bucket = formData.get('bucket') as string
    const folder = formData.get('folder') as string | null

    // Validate inputs
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!bucket) {
      return NextResponse.json(
        { error: 'Bucket name is required' },
        { status: 400 }
      )
    }

    // Validate bucket name
    const validBuckets = ['campaigns', 'ngos', 'posts', 'profiles', 'corporate']
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      )
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size must not exceed 5MB' },
        { status: 400 }
      )
    }

    // Validate folder parameter to prevent path traversal
    if (folder) {
      // Check for path traversal attempts
      if (folder.includes('..') || folder.includes('/') || folder.includes('\\')) {
        return NextResponse.json(
          { error: 'Invalid folder name' },
          { status: 400 }
        )
      }
      // Whitelist allowed folders
      const allowedFolders = ['avatars', 'banners', 'documents', 'uploads']
      if (!allowedFolders.includes(folder)) {
        return NextResponse.json(
          { error: 'Folder not allowed' },
          { status: 400 }
        )
      }
    }

    // Generate unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}_${Date.now()}.${fileExt}`
    const filePath = `${user.id}/${folder || 'uploads'}/${fileName}`

    // Convert File to ArrayBuffer then to Uint8Array
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, uint8Array, {
        contentType: file.type,
        upsert: false,
      })

    if (error) {
      console.error('Error uploading to storage:', error)
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: data.path,
    })
  } catch (error) {
    console.error('Error in image upload:', error)
    return NextResponse.json(
      { error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}

export const POST = rateLimit(RATE_LIMITS.UPLOAD)(handler)

/**
 * Delete image from Supabase Storage
 * DELETE /api/upload/image
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const { bucket, path } = await request.json()

    if (!bucket || !path) {
      return NextResponse.json(
        { error: 'Bucket and path are required' },
        { status: 400 }
      )
    }

    // Verify ownership - path should contain user ID
    if (!path.startsWith(user.id)) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this file' },
        { status: 403 }
      )
    }

    // Validate bucket
    const validBuckets = ['campaigns', 'ngos', 'posts', 'profiles', 'corporate']
    if (!validBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
    }

    // Delete from storage
    const { error } = await supabase.storage.from(bucket).remove([path])

    if (error) {
      console.error('Error deleting from storage:', error)
      return NextResponse.json(
        { error: 'Failed to delete file' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in image deletion:', error)
    return NextResponse.json(
      { error: 'Failed to process deletion' },
      { status: 500 }
    )
  }
}
