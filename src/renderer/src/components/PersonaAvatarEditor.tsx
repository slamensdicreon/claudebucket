import { useRef, useState } from 'react'
import { Pencil, Sparkles, Upload, X } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { Persona } from '@shared/types'
import { Avatar } from '@renderer/components/Avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@renderer/components/ui/dropdown-menu'
import { useT } from '@renderer/i18n/useT'

const MAX_BYTES = 4 * 1024 * 1024

export function PersonaAvatarEditor({
  persona,
  workspaceId,
  onUpdated
}: {
  persona: Persona
  workspaceId: string
  onUpdated: (persona: Persona) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const t = useT()

  function handleFile(file: File) {
    setError(null)
    if (file.size > MAX_BYTES) {
      setError(t('personaAvatar.tooLarge'))
      return
    }
    const reader = new FileReader()
    reader.onload = async () => {
      const updated = await api.personas.update(persona.id, { avatarImageDataUri: reader.result as string })
      onUpdated(updated)
    }
    reader.onerror = () => setError(t('personaAvatar.readError'))
    reader.readAsDataURL(file)
  }

  async function handleGenerate() {
    setGenerating(true)
    setError(null)
    try {
      const updated = await api.personas.generateAvatarImage({ personaId: persona.id, workspaceId })
      onUpdated(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setGenerating(false)
    }
  }

  async function handleRemove() {
    const updated = await api.personas.update(persona.id, { avatarImageDataUri: null })
    onUpdated(updated)
  }

  return (
    <div className="relative">
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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="group relative">
            <Avatar seed={persona.avatarSeed} name={persona.nombre} size={46} imageDataUri={persona.avatarImageDataUri} />
            <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/0 opacity-0 transition-all group-hover:bg-black/40 group-hover:opacity-100">
              {generating ? (
                <Sparkles size={16} className="animate-pulse text-white" />
              ) : (
                <Pencil size={14} className="text-white" />
              )}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onSelect={() => inputRef.current?.click()}>
            <Upload size={13} className="mr-2" /> {t('personaAvatar.upload')}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={handleGenerate} disabled={generating}>
            <Sparkles size={13} className="mr-2" /> {generating ? t('personaAvatar.generating') : t('personaAvatar.generate')}
          </DropdownMenuItem>
          {persona.avatarImageDataUri && (
            <DropdownMenuItem onSelect={handleRemove}>
              <X size={13} className="mr-2" /> {t('personaAvatar.remove')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {error && <div className="absolute top-full z-10 mt-1 w-52 text-[11px] text-danger">{error}</div>}
    </div>
  )
}
