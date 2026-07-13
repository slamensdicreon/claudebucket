import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function PageHeader({
  eyebrow,
  title,
  actions,
  backTo,
  backLabel
}: {
  eyebrow?: string
  title: string
  actions?: ReactNode
  backTo?: string
  backLabel?: string
}) {
  const navigate = useNavigate()
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        {backTo && (
          <button
            className="mb-2 flex items-center gap-1 font-mono-label text-[10.5px] font-semibold text-text-dim hover:text-text"
            onClick={() => navigate(backTo)}
          >
            <ArrowLeft size={12} /> {backLabel ?? 'Volver'}
          </button>
        )}
        {eyebrow && <div className="mb-1.5 font-mono-label text-[10.5px] font-semibold tracking-wide text-text-dim">{eyebrow}</div>}
        <div className="text-xl font-semibold text-text">{title}</div>
      </div>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  )
}
