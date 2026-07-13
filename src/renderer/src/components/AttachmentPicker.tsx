import { useRef, useState } from 'react'
import { FileText, ImagePlus, Paperclip, X } from 'lucide-react'
import type { EstimuloAttachment } from '@shared/types'
import { useT } from '@renderer/i18n/useT'

const MAX_TOTAL_BYTES = 50 * 1024 * 1024
const MAX_FILES = 20
const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,application/pdf'

function inferAttachmentType(file: File): EstimuloAttachment['type'] {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type === 'application/pdf') return 'pdf'
  return 'file'
}

function readAsDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error('File read failed'))
    reader.readAsDataURL(file)
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

export function AttachmentPicker({
  value,
  onChange
}: {
  value: EstimuloAttachment[]
  onChange: (attachments: EstimuloAttachment[]) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  async function handleFiles(files: FileList) {
    setError(null)
    const incoming = Array.from(files)
    if (value.length + incoming.length > MAX_FILES) {
      setError(t('attachmentPicker.tooMany', { max: MAX_FILES }))
      return
    }
    const totalBytes = value.reduce((sum, file) => sum + file.sizeBytes, 0) + incoming.reduce((sum, file) => sum + file.size, 0)
    if (totalBytes > MAX_TOTAL_BYTES) {
      setError(t('attachmentPicker.tooLarge', { max: '50 MB' }))
      return
    }

    try {
      const attachments = await Promise.all(
        incoming.map(async (file) => ({
          id: newId(),
          type: inferAttachmentType(file),
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          dataUri: await readAsDataUri(file),
          sizeBytes: file.size
        }))
      )
      onChange([...value, ...attachments])
    } catch {
      setError(t('attachmentPicker.readError'))
    }
  }

  function remove(id: string) {
    onChange(value.filter((attachment) => attachment.id !== id))
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) void handleFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <div className="flex flex-wrap gap-2">
        {value.map((attachment) => (
          <div key={attachment.id} className="group relative flex h-20 w-28 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface-2">
            {attachment.type === 'image' ? (
              <img src={attachment.dataUri} alt={attachment.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 px-2 text-center text-text-dim">
                <FileText size={20} />
                <span className="max-w-full truncate text-[10.5px]">{attachment.name}</span>
                <span className="font-mono-label text-[9.5px]">{formatBytes(attachment.sizeBytes)}</span>
              </div>
            )}
            <button
              onClick={() => remove(attachment.id)}
              className="absolute right-1 top-1 rounded-full border border-border bg-surface/95 p-1 text-text-dim hover:text-danger"
              title={t('attachmentPicker.remove')}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        <button
          onClick={() => inputRef.current?.click()}
          className="flex h-20 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-border text-xs font-medium text-text-dim hover:text-text"
        >
          {value.length > 0 ? <Paperclip size={16} /> : <ImagePlus size={16} />}
          <span>{t('attachmentPicker.attach')}</span>
        </button>
      </div>
      <div className="mt-1.5 text-[11px] text-text-dim">{t('attachmentPicker.hint')}</div>
      {error && <div className="mt-1 text-[11px] text-danger">{error}</div>}
    </div>
  )
}
