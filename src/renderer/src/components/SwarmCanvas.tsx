import { useEffect, useRef, useState } from 'react'
import { forceCenter, forceCollide, forceManyBody, forceSimulation, forceX, forceY, type SimulationNodeDatum } from 'd3-force'
import { sentimentBucket } from '@shared/types'
import { useT } from '@renderer/i18n/useT'

export interface SwarmNode extends SimulationNodeDatum {
  id: string
  nombre: string
  score: number
  quote: string
}

function readCssColor(varName: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(varName).trim() || '#888'
}

const DRAG_THRESHOLD = 4

export function SwarmCanvas({
  nodes: inputNodes,
  onNodeClick,
  onSelectionChange,
  selectable = false
}: {
  nodes: SwarmNode[]
  onNodeClick?: (id: string) => void
  onSelectionChange?: (ids: string[]) => void
  selectable?: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const t = useT()
  const nodesRef = useRef<SwarmNode[]>([])
  const selectedIdsRef = useRef<Set<string>>(new Set())
  const dragStateRef = useRef<{ startX: number; startY: number; dragging: boolean } | null>(null)
  const drawRef = useRef<() => void>(() => {})
  const [hovered, setHovered] = useState<SwarmNode | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const [marquee, setMarquee] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null)
  const [, forceRerender] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const width = container.clientWidth
    const height = container.clientHeight
    canvas.width = width * window.devicePixelRatio
    canvas.height = height * window.devicePixelRatio
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

    const colors = {
      positivo: readCssColor('--color-success'),
      neutro: readCssColor('--color-warning'),
      negativo: readCssColor('--color-danger'),
      primary: readCssColor('--color-primary')
    }

    const nodes: SwarmNode[] = inputNodes.map((n) => ({ ...n }))
    nodesRef.current = nodes
    const radius = 9

    const simulation = forceSimulation(nodes)
      .force('charge', forceManyBody().strength(-40))
      .force('center', forceCenter(width / 2, height / 2))
      .force('collide', forceCollide(radius + 2))
      .force('x', forceX(width / 2).strength(0.04))
      .force('y', forceY(height / 2).strength(0.04))

    function draw() {
      if (!ctx) return
      ctx.clearRect(0, 0, width, height)
      for (const n of nodes) {
        const bucket = sentimentBucket(n.score)
        const isSelected = selectedIdsRef.current.has(n.id)
        if (isSelected) {
          ctx.beginPath()
          ctx.arc(n.x ?? 0, n.y ?? 0, radius + 3, 0, Math.PI * 2)
          ctx.strokeStyle = colors.primary
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
        ctx.beginPath()
        ctx.arc(n.x ?? 0, n.y ?? 0, radius, 0, Math.PI * 2)
        ctx.fillStyle = colors[bucket]
        ctx.globalAlpha = 0.85
        ctx.fill()
        ctx.globalAlpha = 1
      }
    }
    drawRef.current = draw

    simulation.on('tick', draw)

    return () => {
      simulation.stop()
    }
  }, [inputNodes])

  function handleMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!selectable) return
    const rect = e.currentTarget.getBoundingClientRect()
    dragStateRef.current = { startX: e.clientX - rect.left, startY: e.clientY - rect.top, dragging: false }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (dragStateRef.current) {
      const { startX, startY } = dragStateRef.current
      const dist = Math.hypot(x - startX, y - startY)
      if (dist > DRAG_THRESHOLD) {
        dragStateRef.current.dragging = true
        const x0 = Math.min(startX, x)
        const y0 = Math.min(startY, y)
        const x1 = Math.max(startX, x)
        const y1 = Math.max(startY, y)
        setMarquee({ x0, y0, x1, y1 })
        const selected = nodesRef.current.filter((n) => (n.x ?? 0) >= x0 && (n.x ?? 0) <= x1 && (n.y ?? 0) >= y0 && (n.y ?? 0) <= y1)
        selectedIdsRef.current = new Set(selected.map((n) => n.id))
        drawRef.current()
        forceRerender((v) => v + 1)
        setHovered(null)
        return
      }
    }

    const hit = nodesRef.current.find((n) => Math.hypot((n.x ?? 0) - x, (n.y ?? 0) - y) < 11)
    setHovered(hit ?? null)
    setMousePos(hit ? { x, y } : null)
  }

  function handleMouseUp() {
    const wasDragging = dragStateRef.current?.dragging ?? false
    dragStateRef.current = null
    setMarquee(null)
    if (wasDragging) {
      onSelectionChange?.([...selectedIdsRef.current])
    } else if (hovered && onNodeClick) {
      onNodeClick(hovered.id)
    }
  }

  function clearSelection() {
    selectedIdsRef.current = new Set()
    drawRef.current()
    forceRerender((v) => v + 1)
    onSelectionChange?.([])
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <canvas
        ref={canvasRef}
        className="cursor-pointer"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovered(null)}
        onMouseUp={handleMouseUp}
      />
      {marquee && (
        <div
          className="pointer-events-none absolute border border-dashed border-primary bg-primary/10"
          style={{ left: marquee.x0, top: marquee.y0, width: marquee.x1 - marquee.x0, height: marquee.y1 - marquee.y0 }}
        />
      )}
      {hovered && mousePos && !marquee && (
        <div
          className="pointer-events-none absolute z-10 max-w-[220px] rounded-md border border-border bg-surface-2 px-2.5 py-1.5 text-xs text-text shadow-lg"
          style={{ left: mousePos.x + 14, top: mousePos.y + 14 }}
        >
          <div className="font-semibold">{hovered.nombre}</div>
          <div className="text-text-muted">"{hovered.quote}"</div>
        </div>
      )}
      {selectedIdsRef.current.size > 0 && !marquee && (
        <button
          onClick={clearSelection}
          className="absolute right-3.5 top-3.5 rounded-chip border border-primary/40 bg-primary/15 px-3 py-1.5 font-mono-label text-xs font-semibold text-primary"
        >
          {t('swarm.clearSelection', { count: selectedIdsRef.current.size })}
        </button>
      )}
      <div className="pointer-events-none absolute bottom-3.5 left-3.5 flex gap-3 font-mono-label text-[10.5px] text-text-dim">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-success" /> {t('swarm.positive')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-warning" /> {t('swarm.neutral')}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-danger" /> {t('swarm.negative')}
        </span>
      </div>
    </div>
  )
}
