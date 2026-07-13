import { useEffect, useState } from 'react'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { Persona, TemaTest } from '@shared/types'
import { Card } from '@renderer/components/ui/card'
import { Button } from '@renderer/components/ui/button'
import { Avatar } from '@renderer/components/Avatar'
import { RefreshCw } from 'lucide-react'
import { useT } from '@renderer/i18n/useT'

export function ThemesSection({
  testId,
  workspaceId,
  personasById
}: {
  testId: string
  workspaceId: string
  personasById: Map<string, Persona>
}) {
  const provider = useAppStore((s) => s.currentProvider)
  const model = useAppStore((s) => s.currentModel)
  const [temas, setTemas] = useState<TemaTest[]>([])
  const [loading, setLoading] = useState(false)
  const t = useT()

  useEffect(() => {
    api.temas.list(testId).then(setTemas)
  }, [testId])

  async function handleReextraer() {
    setLoading(true)
    try {
      const result = await api.temas.extraer({ testId, workspaceId, provider, model: model ?? undefined })
      setTemas(result)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-6 max-w-4xl">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium text-text-muted">{t('themes.title')}</div>
        <Button variant="secondary" size="sm" onClick={handleReextraer} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> {loading ? t('themes.refreshing') : t('themes.refresh')}
        </Button>
      </div>

      {temas.length === 0 ? (
        <Card className="p-6 text-center text-sm text-text-dim">{t('themes.empty')}</Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {temas.map((tema) => (
            <Card key={tema.id} className="p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-sm font-semibold text-text">{tema.nombreTema}</div>
                <div className="rounded-chip bg-surface-2 px-2.5 py-0.5 font-mono-label text-[10.5px] text-text-muted">
                  {tema.cantidadMenciones} {t('themes.mentions')}
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {tema.personasRepresentativas.map((v, i) => {
                  const persona = personasById.get(v.personaId)
                  return (
                    <div key={i} className="flex gap-2.5 border-t border-border pt-2.5 first:border-t-0 first:pt-0">
                      <Avatar
                        seed={persona?.avatarSeed ?? v.personaId}
                        name={persona?.nombre ?? '?'}
                        size={24}
                        imageDataUri={persona?.avatarImageDataUri}
                      />
                      <div className="min-w-0">
                        <div className="text-[11.5px] font-semibold text-text">{persona?.nombre ?? 'Persona'}</div>
                        <div className="text-xs text-text-muted">"{v.quote}"</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
