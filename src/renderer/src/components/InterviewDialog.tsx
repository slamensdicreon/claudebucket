import { useState } from 'react'
import { MessagesSquare } from 'lucide-react'
import { api } from '@renderer/lib/api'
import { useAppStore } from '@renderer/store/useAppStore'
import type { InterviewPersonaResult } from '@shared/types'
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '@renderer/components/ui/dialog'
import { Button } from '@renderer/components/ui/button'
import { Label } from '@renderer/components/ui/label'
import { Textarea } from '@renderer/components/ui/textarea'
import { Input } from '@renderer/components/ui/input'
import { Card } from '@renderer/components/ui/card'
import { useT } from '@renderer/i18n/useT'

export function InterviewDialog({ workspaceId, panelId }: { workspaceId: string; panelId: string }) {
  const provider = useAppStore((s) => s.currentProvider)
  const model = useAppStore((s) => s.currentModel)
  const [open, setOpen] = useState(false)
  const [guide, setGuide] = useState('Que te llama la atencion? Que dudas tienes? Que tendria que cambiar para que lo consideres?')
  const [count, setCount] = useState(5)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<InterviewPersonaResult[] | null>(null)
  const t = useT()

  async function run() {
    if (!guide.trim()) return
    setLoading(true)
    try {
      setResults(await api.personas.runInterview({ workspaceId, panelId, guide, count, provider, model: model ?? undefined }))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <MessagesSquare size={14} /> {t('interview.button')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogTitle>{t('interview.title')}</DialogTitle>
        <div className="space-y-3">
          <div>
            <Label htmlFor="interview-guide">{t('interview.guide')}</Label>
            <Textarea id="interview-guide" className="mt-1.5" rows={4} value={guide} onChange={(e) => setGuide(e.target.value)} />
          </div>
          <div className="w-32">
            <Label htmlFor="interview-count">{t('interview.count')}</Label>
            <Input
              id="interview-count"
              type="number"
              min={1}
              max={20}
              className="mt-1.5"
              value={count}
              onChange={(e) => setCount(Math.min(20, Math.max(1, Number(e.target.value) || 1)))}
            />
          </div>
          <Button className="w-full" onClick={run} disabled={loading || !guide.trim()}>
            {loading ? t('interview.running') : t('interview.run')}
          </Button>
          {results && (
            <div className="max-h-96 space-y-2 overflow-y-auto">
              {results.map((r) => (
                <Card key={r.personaId} className="p-3">
                  <div className="text-sm font-semibold text-text">{r.personaNombre}</div>
                  <div className="mt-1 text-sm leading-relaxed text-text-muted">{r.respuesta}</div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
