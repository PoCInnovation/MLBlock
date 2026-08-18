import dagre from '@dagrejs/dagre'

export type LayoutNode = {
  id: string
  width: number
  height: number
}

export type LayoutEdge = { source: string; target: string }

// Espacements généreux : coins smoothstep, labels d'edge, animations de particules.
const RANKDIR = 'TB'
const RANKSEP = 80
const NODESEP = 50

/**
 * Dispose les nœuds hiérarchiquement (sources au-dessus des cibles, croisements
 * minimisés) via dagre. Fonction pure : aucun DOM, aucune dépendance store —
 * testable en environnement node. Déterministe : même graphe → même layout.
 *
 * dagre renvoie les CENTRES des nœuds ; la sortie est convertie en coin
 * supérieur gauche, les coordonnées ReactFlow. Les positions d'entrée sont
 * ignorées : dagre recalcule tout.
 */
export function arrangeGraph(
  nodes: LayoutNode[],
  edges: LayoutEdge[] = [],
): Record<string, { x: number; y: number }> {
  const g = new dagre.graphlib.Graph()
  g.setGraph({ rankdir: RANKDIR, ranksep: RANKSEP, nodesep: NODESEP })
  g.setDefaultEdgeLabel(() => ({}))

  // Largeur/hauteur minimales : un nœud à dimension 0 replierait le graphe
  // (toutes les nodes sur un même point) et casserait l'anti-chevauchement.
  const sizes: Record<string, { width: number; height: number }> = {}
  for (const n of nodes) {
    sizes[n.id] = { width: Math.max(n.width, 1), height: Math.max(n.height, 1) }
    g.setNode(n.id, sizes[n.id])
  }

  // On ignore les edges dont une extrémité est absente ou identique
  // (self-loop) : dagre lèverait une erreur sinon, et une seule edge invalide
  // casserait le bouton entier.
  for (const e of edges) {
    if (e.source !== e.target && sizes[e.source] && sizes[e.target]) {
      g.setEdge(e.source, e.target)
    }
  }

  dagre.layout(g)

  const out: Record<string, { x: number; y: number }> = {}
  for (const n of nodes) {
    const { width, height } = sizes[n.id]
    const center = g.node(n.id) as { x: number; y: number }
    out[n.id] = { x: center.x - width / 2, y: center.y - height / 2 }
  }
  return out
}
