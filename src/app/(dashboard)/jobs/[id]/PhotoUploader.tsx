'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getSignedUploadUrl, saveJobPhoto } from '../photo-actions'
import { Upload, ImagePlus, Loader2, CheckCircle2, AlertCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

const PHOTO_TYPES = ['intake', 'damage', 'progress', 'parts', 'final'] as const
type PhotoType = typeof PHOTO_TYPES[number]

const PHOTO_TYPE_LABELS: Record<PhotoType, string> = {
  intake: 'Intake',
  damage: 'Damage',
  progress: 'Progress',
  parts: 'Parts',
  final: 'Final',
}

const PHOTO_TYPE_COLORS: Record<PhotoType, string> = {
  intake: 'text-[#6eb3ff] border-[#0068ed]/30 bg-[#0068ed]/10',
  damage: 'text-[#ffb4ab] border-[#93000a]/30 bg-[#93000a]/10',
  progress: 'text-[#00e475] border-[#00e475]/30 bg-[#00e475]/10',
  parts: 'text-[#ffba79] border-[#ffdec4]/30 bg-[#ffdec4]/10',
  final: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
}

interface UploadState {
  file: File
  type: PhotoType
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
  preview: string
}

export default function PhotoUploader({
  jobOrderId,
  onUploaded,
}: {
  jobOrderId: string
  onUploaded?: () => void
}) {
  const [queue, setQueue] = useState<UploadState[]>([])
  const [selectedType, setSelectedType] = useState<PhotoType>('intake')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  function addFiles(files: File[]) {
    const validFiles = files.filter((f) => f.type.startsWith('image/'))
    const newItems: UploadState[] = validFiles.map((file) => ({
      file,
      type: selectedType,
      status: 'pending',
      preview: URL.createObjectURL(file),
    }))
    setQueue((prev) => [...prev, ...newItems])
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setIsDragOver(false)
    addFiles(Array.from(e.dataTransfer.files))
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  function removeFromQueue(idx: number) {
    setQueue((prev) => {
      URL.revokeObjectURL(prev[idx].preview)
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function uploadAll() {
    const pending = queue.filter((q) => q.status === 'pending')
    if (pending.length === 0) return

    setIsUploading(true)
    let uploadedAny = false

    try {
      const supabase = createClient()

      for (let i = 0; i < queue.length; i++) {
        const item = queue[i]
        if (item.status !== 'pending') continue

        // Mark uploading
        setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: 'uploading' } : q))

        try {
          // 1. Get signed upload token
          const result = await getSignedUploadUrl(jobOrderId, item.type, item.file.name)
          if ('error' in result && result.error) throw new Error(result.error)
          if (!('storagePath' in result) || !result.storagePath || !result.token) {
            throw new Error('No signed upload token returned')
          }

          // 2. Upload file directly to private Supabase Storage
          const { error: uploadError } = await supabase.storage
            .from('job-photos')
            .uploadToSignedUrl(result.storagePath, result.token, item.file, {
              contentType: item.file.type,
            })

          if (uploadError) throw new Error(uploadError.message)

          // 3. Save DB row
          const saveResult = await saveJobPhoto(jobOrderId, result.storagePath, item.type)
          if (saveResult?.error) throw new Error(saveResult.error)

          uploadedAny = true
          setQueue((prev) => prev.map((q, idx) => idx === i ? { ...q, status: 'done' } : q))
        } catch (err) {
          setQueue((prev) =>
            prev.map((q, idx) =>
              idx === i ? { ...q, status: 'error', error: (err as Error).message } : q
            )
          )
        }
      }
    } finally {
      setIsUploading(false)
    }

    if (uploadedAny) {
      onUploaded?.()
      router.refresh()
    }
  }

  const pendingCount = queue.filter((q) => q.status === 'pending').length

  return (
    <div className="space-y-4">
      {/* Photo type selector */}
      <div className="flex gap-2 flex-wrap">
        {PHOTO_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setSelectedType(type)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
              selectedType === type
                ? PHOTO_TYPE_COLORS[type]
                : 'text-[#859585] border-[#3b4a3d] bg-transparent hover:border-[#859585]'
            }`}
          >
            {PHOTO_TYPE_LABELS[type]}
          </button>
        ))}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center gap-2 h-32 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          isDragOver
            ? 'border-[#00e475] bg-[#00e475]/5'
            : 'border-[#3b4a3d] bg-[#0d0d0d] hover:border-[#859585] hover:bg-[#161616]'
        }`}
      >
        <ImagePlus className={`w-6 h-6 ${isDragOver ? 'text-[#00e475]' : 'text-[#3b4a3d]'}`} />
        <p className="text-xs text-[#859585]">
          Drop photos here or <span className="text-[#dbe5d9] underline">browse</span>
        </p>
        <p className="text-xs text-[#3b4a3d]">
          Uploading as <span className={`font-semibold ${PHOTO_TYPE_COLORS[selectedType].split(' ')[0]}`}>{PHOTO_TYPE_LABELS[selectedType]}</span>
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={handleFileInput}
        />
      </div>

      {/* Queue preview */}
      {queue.length > 0 && (
        <div className="space-y-2">
          {queue.map((item, idx) => (
            <div
              key={idx}
              className="flex items-center gap-3 px-3 py-2 rounded-xl bg-[#0d0d0d] border border-[#262626]"
            >
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={item.preview}
                alt=""
                className="w-10 h-10 rounded-lg object-cover border border-[#262626] shrink-0"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-[#dbe5d9] truncate">{item.file.name}</p>
                <span className={`text-xs font-semibold ${PHOTO_TYPE_COLORS[item.type].split(' ')[0]}`}>
                  {PHOTO_TYPE_LABELS[item.type]}
                </span>
              </div>
              {/* Status */}
              <div className="shrink-0">
                {item.status === 'pending' && (
                  <button onClick={() => removeFromQueue(idx)} className="text-[#3b4a3d] hover:text-[#ffb4ab]">
                    <X className="w-4 h-4" />
                  </button>
                )}
                {item.status === 'uploading' && <Loader2 className="w-4 h-4 text-[#0068ed] animate-spin" />}
                {item.status === 'done' && <CheckCircle2 className="w-4 h-4 text-[#00e475]" />}
                {item.status === 'error' && (
                  <div title={item.error}><AlertCircle className="w-4 h-4 text-[#ffb4ab]" /></div>
                )}
              </div>
            </div>
          ))}

          {pendingCount > 0 && (
            <Button onClick={uploadAll} disabled={isUploading} size="sm" className="w-full">
              <Upload className="w-4 h-4" />
              Upload {pendingCount} photo{pendingCount > 1 ? 's' : ''}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
