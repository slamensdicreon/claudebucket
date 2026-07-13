import { useRef, useState } from 'react'
import { ImagePlus, X } from 'lucide-react'
import { useT } from '@renderer/i18n/useT'

const MAX_BYTES = 4 * 1024 * 1024

export function ImagePicker({ value, onChange }: { value: string | null; onChange: (dataUri: string | null) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  function handleFile(file: File) {
    setError(null)
    if (file.size > MAX_BYTES) {
      setError(t('personaAvatar.tooLarge'))
      return
    }
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.onerror = () => setError(t('personaAvatar.readError'))
    reader.readAsDataURL(file)
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
          e.target.value = ''
        }}
      />
      {value ? (
        <div className="relative w-fit">
          <img src={value} alt={t('imagePicker.stimulusAlt')} className="max-h-40 rounded-lg border border-border object-cover" />
          <button
            onClick={() => onChange(null)}
            className="absolute -right-2 -top-2 rounded-full border border-border bg-surface-2 p-1 text-text-dim hover:text-danger"
          >
            <X size={12} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-text-dim hover:text-text"
        >
          <ImagePlus size={13} /> {t('imagePicker.attach')}
        </button>
      )}
      {error && <div className="mt-1 text-[11px] text-danger">{error}</div>}
    </div>
  )
}
