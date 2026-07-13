import { useState } from 'react'
import { Plus, Trash2, ChevronUp, ChevronDown, GripVertical } from 'lucide-react'
import type { EstimuloTipo, EtapaFunnelDraft } from '@shared/types'
import { Input } from '@renderer/components/ui/input'
import { Textarea } from '@renderer/components/ui/textarea'
import { Label } from '@renderer/components/ui/label'
import { AttachmentPicker } from '@renderer/components/AttachmentPicker'
import { cn } from '@renderer/lib/utils'
import { useT } from '@renderer/i18n/useT'

function emptyStage(orden: number): EtapaFunnelDraft {
  return { orden, tipoEstimulo: 'texto', estimuloContenido: '', estimuloMetadata: {}, titulo: `Etapa ${orden + 1}` }
}

function inferTipo(hasText: boolean, hasAttachments: boolean): EstimuloTipo {
  if (hasAttachments && hasText) return 'multimodal'
  if (hasAttachments) return 'imagen'
  return 'texto'
}

function reorder<T>(list: T[], from: number, to: number): T[] {
  const next = [...list]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next
}

export function FunnelBuilder({
  etapas,
  onChange
}: {
  etapas: EtapaFunnelDraft[]
  onChange: (etapas: EtapaFunnelDraft[]) => void
}) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const t = useT()

  function update(index: number, patch: Partial<EtapaFunnelDraft>) {
    onChange(
      etapas.map((e, i) => {
        if (i !== index) return e
        const next = { ...e, ...patch }
        return {
          ...next,
          tipoEstimulo: inferTipo(
            next.estimuloContenido.trim().length > 0,
            Boolean(next.estimuloMetadata.imagenDataUri) || (next.estimuloMetadata.attachments?.length ?? 0) > 0
          )
        }
      })
    )
  }

  function remove(index: number) {
    onChange(etapas.filter((_, i) => i !== index).map((e, i) => ({ ...e, orden: i })))
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir
    if (target < 0 || target >= etapas.length) return
    onChange(reorder(etapas, index, target).map((e, i) => ({ ...e, orden: i })))
  }

  function add() {
    onChange([...etapas, emptyStage(etapas.length)])
  }

  function handleDrop(targetIndex: number) {
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null)
      setDropIndex(null)
      return
    }
    onChange(reorder(etapas, draggedIndex, targetIndex).map((e, i) => ({ ...e, orden: i })))
    setDraggedIndex(null)
    setDropIndex(null)
  }

  return (
    <div className="space-y-3">
      {etapas.map((etapa, i) => (
        <div
          key={i}
          draggable
          onDragStart={(e) => {
            setDraggedIndex(i)
            e.dataTransfer.effectAllowed = 'move'
          }}
          onDragOver={(e) => {
            e.preventDefault()
            if (draggedIndex !== null && draggedIndex !== i) setDropIndex(i)
          }}
          onDragLeave={() => setDropIndex((d) => (d === i ? null : d))}
          onDrop={(e) => {
            e.preventDefault()
            handleDrop(i)
          }}
          onDragEnd={() => {
            setDraggedIndex(null)
            setDropIndex(null)
          }}
          className={cn(
            'rounded-card border bg-surface p-4 transition-all',
            draggedIndex === i ? 'border-primary/40 opacity-40' : 'border-border',
            dropIndex === i && draggedIndex !== i && 'border-primary ring-1 ring-primary/50'
          )}
        >
          <div className="mb-3 flex items-center gap-2">
            <div className="cursor-grab text-text-dim active:cursor-grabbing" title={t('funnelBuilder.dragHint')}>
              <GripVertical size={14} />
            </div>
            <div className="flex h-5 w-5 flex-none items-center justify-center rounded-full border border-border bg-surface-2 font-mono-label text-[10.5px] text-text">
              {i + 1}
            </div>
            <Input
              value={etapa.titulo}
              onChange={(e) => update(i, { titulo: e.target.value })}
              className="h-8 flex-1 text-sm font-semibold"
              placeholder={t('funnelBuilder.stageLabel', { n: i + 1 })}
            />
            <div className="flex flex-none gap-0.5">
              <button className="rounded p-1 text-text-dim hover:text-text disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)}>
                <ChevronUp size={14} />
              </button>
              <button
                className="rounded p-1 text-text-dim hover:text-text disabled:opacity-30"
                disabled={i === etapas.length - 1}
                onClick={() => move(i, 1)}
              >
                <ChevronDown size={14} />
              </button>
              <button className="rounded p-1 text-text-dim hover:text-danger" onClick={() => remove(i)}>
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <Textarea
            rows={3}
            value={etapa.estimuloContenido}
            onChange={(e) => update(i, { estimuloContenido: e.target.value })}
            placeholder={t('funnelBuilder.stagePlaceholder')}
          />
          <div className="mt-2.5">
            <AttachmentPicker
              value={etapa.estimuloMetadata.attachments ?? []}
              onChange={(attachments) =>
                update(i, {
                  estimuloMetadata: {
                    attachments,
                    imagenDataUri: attachments.find((attachment) => attachment.type === 'image')?.dataUri
                  }
                })
              }
            />
          </div>
        </div>
      ))}
      <button
        onClick={add}
        className="flex w-full items-center justify-center gap-1.5 rounded-card border border-dashed border-border py-3 text-xs font-medium text-text-dim hover:text-text"
      >
        <Plus size={13} /> {t('funnelBuilder.addStage')}
      </button>
      {etapas.length === 0 && <Label className="text-[11px] normal-case">{t('funnelBuilder.empty')}</Label>}
    </div>
  )
}
