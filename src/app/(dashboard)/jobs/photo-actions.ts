'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

const BUCKET = 'job-photos'
const PHOTO_TYPES = ['intake', 'damage', 'progress', 'parts', 'final'] as const
type PhotoType = typeof PHOTO_TYPES[number]

// ─── Get signed upload URL ────────────────────────────────────────────────────
// Called from the client just before the file is uploaded.
// Returns a short-lived signed URL to PUT the file directly to Supabase Storage.
export async function getSignedUploadUrl(
  jobOrderId: string,
  photoType: PhotoType,
  fileName: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  if (!PHOTO_TYPES.includes(photoType)) return { error: 'Invalid photo type' }

  // Sanitise filename
  const ext = fileName.split('.').pop()?.toLowerCase() ?? 'jpg'
  const uuid = crypto.randomUUID()
  const storagePath = `jobs/${jobOrderId}/${photoType}/${uuid}.${ext}`

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(storagePath)

  if (error) return { error: error.message }
  return { signedUrl: data.signedUrl, storagePath, token: data.token }
}

// ─── Save job_photos row after upload ────────────────────────────────────────
export async function saveJobPhoto(
  jobOrderId: string,
  storagePath: string,
  photoType: PhotoType,
  issueId?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  if (!PHOTO_TYPES.includes(photoType)) return { error: 'Invalid photo type' }

  const { error } = await supabase.from('job_photos').insert({
    job_order_id: jobOrderId,
    storage_path: storagePath,
    photo_type: photoType,
    issue_id: issueId ?? null,
    uploaded_by: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath(`/jobs/${jobOrderId}`)
  return { success: true }
}

// ─── Delete photo ─────────────────────────────────────────────────────────────
export async function deleteJobPhoto(photoId: string, storagePath: string, jobOrderId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }

  // Remove from storage
  const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath])
  if (storageError) return { error: storageError.message }

  // Remove DB row
  const { error: dbError } = await supabase.from('job_photos').delete().eq('id', photoId)
  if (dbError) return { error: dbError.message }

  revalidatePath(`/jobs/${jobOrderId}`)
  return { success: true }
}

// ─── Get signed view URLs for a list of storage paths ────────────────────────
export async function getSignedViewUrls(
  storagePaths: string[]
): Promise<{ urls: Record<string, string>; error?: string }> {
  if (storagePaths.length === 0) return { urls: {} }
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized', urls: {} }

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrls(storagePaths, 60 * 60) // 1 hour

  if (error) return { error: error.message, urls: {} }

  const urls: Record<string, string> = {}
  data?.forEach((item) => {
    if (item.signedUrl && item.path) urls[item.path] = item.signedUrl
  })
  return { urls }
}
