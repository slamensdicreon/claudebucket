import { useEffect, useState } from 'react'
import { Download, RefreshCw, Search, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { api } from '@renderer/lib/api'
import type { UpdateStatus } from '@shared/types'
import { Button } from '@renderer/components/ui/button'
import { useT } from '@renderer/i18n/useT'

export function UpdateBanner() {
  const [status, setStatus] = useState<UpdateStatus>({ state: 'idle' })
  const [busy, setBusy] = useState(false)
  const [supported, setSupported] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const t = useT()

  useEffect(() => {
    let unsubscribe = () => {}
    api.update.isSupported().then(setSupported)
    api.update.getStatus().then(setStatus)
    unsubscribe = api.update.onStatus((next) => {
      setStatus(next)
      if (next.state === 'available' || next.state === 'downloaded' || next.state === 'error') setExpanded(true)
    })
    return () => unsubscribe()
  }, [])

  if (!supported && status.state === 'idle') {
    return null
  }

  async function handleCheck() {
    setBusy(true)
    try {
      await api.update.check()
    } finally {
      setBusy(false)
    }
  }

  async function handleDownload() {
    setBusy(true)
    try {
      await api.update.download()
    } finally {
      setBusy(false)
    }
  }

  const releaseNotes =
    (status.state === 'available' || status.state === 'downloaded') && status.releaseNotes ? status.releaseNotes : ''
  const progressText =
    status.state === 'downloading'
      ? t('update.downloadingDetail', {
          percent: status.percent,
          transferred: formatBytes(status.transferred),
          total: formatBytes(status.total),
          speed: formatSpeed(status.bytesPerSecond)
        })
      : ''

  return (
    <div className="flex flex-none flex-col gap-2 border-b border-primary/30 bg-primary/10 px-6 py-2 text-xs">
      <div className="flex items-center justify-between gap-3">
        {status.state === 'idle' && (
          <>
            <div className="text-text-muted">{t('update.idle')}</div>
            <Button size="sm" variant="secondary" onClick={handleCheck} disabled={busy}>
              <Search size={13} /> {busy ? t('update.checking') : t('update.check')}
            </Button>
          </>
        )}
        {status.state === 'checking' && (
          <div className="flex items-center gap-2 text-text-muted">
            <RefreshCw size={13} className="animate-spin" /> {t('update.checking')}
          </div>
        )}
        {status.state === 'not-available' && (
          <>
            <div className="flex items-center gap-2 text-text-muted">
              <CheckCircle2 size={13} className="text-success" /> {t('update.notAvailable')}
            </div>
            <Button size="sm" variant="secondary" onClick={handleCheck} disabled={busy}>
              <Search size={13} /> {t('update.checkAgain')}
            </Button>
          </>
        )}
        {status.state === 'error' && (
          <>
            <div className="flex items-center gap-2 text-danger">
              <AlertTriangle size={13} /> {t('update.error', { message: status.message })}
            </div>
            <Button size="sm" variant="secondary" onClick={handleCheck} disabled={busy}>
              <Search size={13} /> {t('update.retry')}
            </Button>
          </>
        )}
      {status.state === 'available' && (
        <>
            <div className="text-text-muted">{t('update.available', { version: status.version })}</div>
            <div className="flex gap-2">
              {releaseNotes && (
                <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
                  {expanded ? t('update.hideChangelog') : t('update.showChangelog')}
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={handleDownload} disabled={busy}>
                <Download size={13} /> {busy ? t('update.starting') : t('update.download')}
              </Button>
            </div>
        </>
      )}
      {status.state === 'downloading' && (
        <>
          <div className="flex items-center gap-2 text-text-muted">
              <RefreshCw size={13} className="animate-spin" /> {progressText}
          </div>
            <div className="font-mono-label text-[11px] text-text-dim">{status.percent}%</div>
        </>
      )}
      {status.state === 'downloaded' && (
        <>
          <div className="text-text-muted">{t('update.ready', { version: status.version })}</div>
            <div className="flex gap-2">
              {releaseNotes && (
                <Button size="sm" variant="ghost" onClick={() => setExpanded((v) => !v)}>
                  {expanded ? t('update.hideChangelog') : t('update.showChangelog')}
                </Button>
              )}
              <Button size="sm" onClick={() => api.update.install()}>
                {t('update.restartNow')}
              </Button>
            </div>
        </>
      )}
      </div>
      {status.state === 'downloading' && (
        <div className="h-2 overflow-hidden rounded-full bg-bg">
          <div className="h-full bg-primary transition-all" style={{ width: `${status.percent}%` }} />
        </div>
      )}
      {expanded && releaseNotes && (
        <div className="max-h-40 overflow-y-auto rounded-lg border border-border bg-bg p-3 text-xs leading-relaxed text-text-muted whitespace-pre-wrap">
          {releaseNotes}
        </div>
      )}
    </div>
  )
}

function formatBytes(value?: number): string {
  if (!value || value <= 0) return '-'
  const mb = value / 1024 / 1024
  return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`
}

function formatSpeed(value?: number): string {
  if (!value || value <= 0) return '-'
  return `${formatBytes(value)}/s`
}
