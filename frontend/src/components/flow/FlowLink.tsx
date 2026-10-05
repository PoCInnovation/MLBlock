import { memo, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react'
import { EdgeLabelRenderer, getSmoothStepPath, type EdgeProps } from '@xyflow/react'
import useAppStore from '../../store/useAppStore'
import { engineColor, resolveEdgeStyle } from '../../utils/superblocks'
const CORNER = 16

/** Préférence système « réduire les animations » (SMIL n'est pas désactivable par CSS). */
function usePrefersReducedMotion(): boolean {
  const mq = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
  return useSyncExternalStore(
    cb => {
      mq?.addEventListener('change', cb)
      return () => mq?.removeEventListener('change', cb)
    },
    () => mq?.matches ?? false,
  )
}

/** Décalage de départ dérivé de l'id du lien : désynchronise les particules. */
function beginOffset(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 1000
  return h / 1000
}

/**
 * Lien entre blocs : chemin smoothstep (coins arrondis) entre les deux
 * handles, avec une particule animée et un bouton de suppression au centre.
 */
function FlowLink({ id, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition, style, data }: EdgeProps) {
  const applyFlowEdgeChanges = useAppStore(s => s.applyFlowEdgeChanges)
  const reduceMotion = usePrefersReducedMotion()
  const pathRef = useRef<SVGPathElement>(null)
  // Centre du chemin, mesuré après rendu : position du bouton de suppression.
  const [center, setCenter] = useState<{ x: number; y: number } | null>(null)

  const [d] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: CORNER,
  })

  // Centre du chemin, mesuré après rendu : position du bouton de suppression.
  useLayoutEffect(() => {
    const el = pathRef.current
    if (!el) return
    setCenter(el.getPointAtLength(el.getTotalLength() / 2))
  }, [d])

  const baseColor = typeof style?.stroke === 'string' ? style.stroke : '#888'
  const gradient = (data as { gradient?: { from: string; to: string } } | undefined)?.gradient
  // Arête inter-moteurs : dégradé bicolore (spec §5), sinon couleur unie.
  const color = gradient ? engineColor(gradient.to) : baseColor
  const pairClass = gradient ? resolveEdgeStyle({}, gradient).pairClass : ''
  const markerId = `mlb-arrow-${id}`

  return (
    <g>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill={color} />
        </marker>
        {gradient && (
          <linearGradient id={`mlb-grad-${gradient.from}-to-${gradient.to}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" className={`mlb-stop-${gradient.from}`} />
            <stop offset="100%" className={`mlb-stop-${gradient.to}`} />
          </linearGradient>
        )}
      </defs>
      <path
        ref={pathRef}
        d={d}
        fill="none"
        className={`react-flow__edge-path stroke-2${pairClass}`}
        style={style}
        markerEnd={`url(#${markerId})`}
      />
      {!reduceMotion && (
        <circle
          r="4"
          fill={color}
          className="pointer-events-none"
          aria-hidden="true"
        >
          {/* keyPoints: la particule s'arrête avant la flèche (fin du chemin). */}
          <animateMotion
            dur="2s"
            begin={`${beginOffset(id)}s`}
            repeatCount="indefinite"
            path={d}
            keyPoints="0;0.94"
            keyTimes="0;1"
          />
        </circle>
      )}
      {center && (
        <EdgeLabelRenderer>
          <button
            type="button"
            title="Supprimer le lien"
            aria-label="Supprimer le lien"
            onClick={e => {
              e.stopPropagation()
              // Même chemin que la touche Delete : point d'undo puis remove.
              useAppStore.getState().commitUndoPoint()
              applyFlowEdgeChanges([{ id, type: 'remove' }])
            }}
            className="edge-delete-btn absolute w-6 h-6 rounded-full border border-border bg-surface2 text-text-muted text-xs flex items-center justify-center cursor-pointer z-10 pointer-events-auto shadow-btn"
            style={{
              transform: `translate(-50%, -50%) translate(${center.x}px, ${center.y}px)`,
            }}
          >
            ✕
          </button>
        </EdgeLabelRenderer>
      )}
    </g>
  )
}

export default memo(FlowLink)
