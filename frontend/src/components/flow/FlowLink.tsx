import { memo } from 'react'
import type { EdgeProps } from 'reactflow'
import useAppStore from '../../store/useAppStore'
import { COL_W, COL_PAD, colHeight, colOf } from '../../utils/gridLayout'

/** Couloir supérieur : au-dessus des cartes (les colonnes commencent à y=0). */
const TOP_Y = -28
/** Rayon des coins du routage. */
const CORNER = 16

function roundedPath(points: [number, number][]): string {
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length - 1; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    const [x2, y2] = points[i + 1]
    const dx1 = Math.sign(x1 - x0)
    const dy1 = Math.sign(y1 - y0)
    const dx2 = Math.sign(x2 - x1)
    const dy2 = Math.sign(y2 - y1)
    d += ` L ${x1 - dx1 * CORNER} ${y1 - dy1 * CORNER}`
    d += ` Q ${x1} ${y1} ${x1 + dx2 * CORNER} ${y1 + dy2 * CORNER}`
  }
  const last = points[points.length - 1]
  d += ` L ${last[0]} ${last[1]}`
  return d
}

/**
 * Lien entre blocs de la vue grille : routage par couloirs pour rendre la
 * connectivité lisible.
 * - Lien vers la colonne SUIVANTE : couloir au-dessus des deux colonnes.
 * - Lien qui SAUTE des colonnes : au-dessus de la colonne de départ, puis
 *   en dessous des colonnes traversées jusqu'à la destination.
 */
function FlowLink({ id, source, target, sourceX, sourceY, targetX, targetY, style }: EdgeProps) {
  const viewMode = useAppStore(s => s.viewMode)
  const flowNodes = useAppStore(s => s.flowNodes)
  const flowEdges = useAppStore(s => s.flowEdges)

  let d: string
  const src = flowNodes.find(n => n.id === source)
  const tgt = flowNodes.find(n => n.id === target)
  if (viewMode === 'grid' && src && tgt) {
    const sc = colOf(src)
    const tc = colOf(tgt)
    // Lane : position parmi les liens de la même paire de colonnes — chaque
    // lien a son couloir (décalage vertical) pour rester différenciable.
    const pair = flowEdges.filter(e => {
      const s = flowNodes.find(n => n.id === e.source)
      const t = flowNodes.find(n => n.id === e.target)
      return !!s && !!t && colOf(s) === sc && colOf(t) === tc
    })
    const lane = Math.max(0, pair.findIndex(e => e.id === id))
    const laneOffset = lane * 9
    const topY = TOP_Y - laneOffset
    if (tc === sc + 1) {
      // Colonne suivante : couloir horizontal au-dessus des deux cartes.
      d = roundedPath([[sourceX, sourceY], [sourceX, topY], [targetX, topY], [targetX, targetY]])
    } else if (tc > sc + 1) {
      // Saut de colonnes : au-dessus de la colonne source, en dessous des
      // cartes traversées (couloir inférieur), puis remontée à la cible.
      let bottomY = topY
      for (let i = sc + 1; i < tc; i++) {
        bottomY = Math.max(bottomY, colHeight(flowNodes, i) + 28 + laneOffset)
      }
      const rightA = sc * COL_W + COL_W - COL_PAD
      const leftB = tc * COL_W + COL_PAD
      d = roundedPath([
        [sourceX, sourceY],
        [sourceX, topY],
        [rightA, topY],
        [rightA, bottomY],
        [leftB, bottomY],
        [leftB, targetY],
        [targetX, targetY],
      ])
    } else {
      d = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
    }
  } else {
    d = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
  }

  const color = typeof style?.stroke === 'string' ? style.stroke : '#888'
  const markerId = `mlb-arrow-${id}`

  return (
    <g>
      <defs>
        <marker id={markerId} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 1 L 9 5 L 0 9 z" fill={color} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        strokeWidth={2.5}
        style={style}
        markerEnd={`url(#${markerId})`}
        className="react-flow__edge-path"
      />
    </g>
  )
}

export default memo(FlowLink)
