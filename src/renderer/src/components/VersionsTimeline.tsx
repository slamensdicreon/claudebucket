import { useEffect, useState } from 'react'
import { api } from '@renderer/lib/api'
import type { PersonaVersion } from '@shared/types'
import { formatDateTime } from '@renderer/lib/utils'
import { Card } from '@renderer/components/ui/card'
import { Badge } from '@renderer/components/ui/badge'
import { useT, type TranslationKey } from '@renderer/i18n/useT'

const SNAPSHOT_LABEL_KEYS: Record<string, TranslationKey> = {
  nombre: 'personaForm.nombre',
  edad: 'personaForm.edad',
  genero: 'personaForm.genero',
  ciudad: 'personaForm.ciudad',
  pais: 'personaForm.pais',
  ocupacion: 'personaForm.ocupacion',
  nivelIngreso: 'personaForm.nivelIngreso',
  nivelEducativo: 'personaForm.nivelEducativo',
  estadoCivil: 'personaForm.estadoCivil',
  disposicionBase: 'personaForm.disposicionBase',
  historiaPersonal: 'personaForm.historia',
  canalPreferido: 'personaForm.canalPreferido'
}

function TestsUsingVersion({ versionId }: { versionId: string }) {
  const [tests, setTests] = useState<Array<{ testId: string; testNombre: string }>>([])

  useEffect(() => {
    api.versions.testsUsing(versionId).then(setTests)
  }, [versionId])

  if (tests.length === 0) return null

  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {tests.map((t) => (
        <span
          key={t.testId}
          className="rounded-chip border border-border bg-surface px-2.5 py-0.5 font-mono-label text-[10.5px] text-text-muted"
        >
          {t.testNombre}
        </span>
      ))}
    </div>
  )
}

export function VersionsTimeline({ personaId }: { personaId: string }) {
  const [versions, setVersions] = useState<PersonaVersion[]>([])
  const [selected, setSelected] = useState<PersonaVersion | null>(null)
  const t = useT()

  useEffect(() => {
    api.versions.list(personaId).then((list) => {
      setVersions(list)
      setSelected(list[0] ?? null)
    })
  }, [personaId])

  if (versions.length === 0) {
    return <div className="py-10 text-center text-sm text-text-dim">{t('versions.empty')}</div>
  }

  return (
    <div className="flex max-w-3xl gap-6">
      <div className="relative flex-1 min-w-0 pl-5">
        <div className="absolute bottom-1.5 left-1 top-1.5 w-px bg-border" />
        {versions.map((v, i) => (
          <div key={v.id} className="relative mb-4">
            <div
              className={`absolute -left-[19px] top-1 h-2.5 w-2.5 rounded-full border-2 border-bg ${i === 0 ? 'bg-primary' : 'bg-text-dim'}`}
            />
            <button className="w-full text-left" onClick={() => setSelected(v)}>
              <Card className={`p-3.5 ${selected?.id === v.id ? 'border-primary/50' : ''}`}>
                <div className="mb-1.5 flex items-center gap-2">
                  <div className="font-mono-label text-[11px] text-text-muted">{formatDateTime(v.createdAt)}</div>
                  {i === 0 && <Badge variant="success">{t('versions.current')}</Badge>}
                </div>
                <div className="text-xs text-text-muted">{v.diffResumen}</div>
              </Card>
            </button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="h-fit w-72 flex-none rounded-card border border-border bg-surface-2 p-4">
          <div className="mb-1 text-sm font-semibold text-text">{t('versions.snapshotTitle')}</div>
          <div className="mb-3 font-mono-label text-[10.5px] text-text-dim">{formatDateTime(selected.createdAt)}</div>
          <div className="flex flex-col gap-1.5 text-xs">
            {Object.entries(SNAPSHOT_LABEL_KEYS).map(([key, labelKey]) => {
              const value = (selected.snapshot as Record<string, unknown>)[key]
              if (value === undefined || value === '') return null
              return (
                <div key={key} className="flex justify-between gap-3">
                  <span className="flex-none text-text-dim">{t(labelKey)}</span>
                  <span className="truncate text-right text-text-muted">{String(value)}</span>
                </div>
              )
            })}
          </div>
          <TestsUsingVersion versionId={selected.id} />
        </div>
      )}
    </div>
  )
}
