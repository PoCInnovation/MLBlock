import { memo, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import useAppStore from '../../store/useAppStore'
import { blockCardInfo, ENGINE_COLORS } from '../../utils/superblocks'

const ENGINE_LABEL: Record<string, string> = {
  pytorch: 'PyTorch',
  sklearn: 'Scikit-Learn',
  gym: 'Gymnasium',
  mlflow: 'MLflow',
  viz: 'Viz',
  generic: 'Générique',
}

/**
 * Carte de bloc — unique element de rendu partagé par la liste du bas de la
 * sheet, la config et le canvas : même nom, même forme, mêmes ports. Aucun
 * paramètre ici (visible seulement au clic sur le bloc posé).
 */
function BlockCard({
  type,
  onClick,
  draggable,
  onDelete,
}: {
  type: string
  onClick?: () => void
  /** Canvas uniquement : poignée de déplacement (ReactFlow dragHandle). */
  draggable?: boolean
  onDelete?: () => void
}) {
  const catalog = useAppStore(s => s.catalog)
  const info = useMemo(
    () => (catalog ? blockCardInfo(catalog, type) : null),
    [catalog, type],
  )
  if (!info) return null

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } } : undefined}
      className="group/card relative flex flex-col gap-2 w-full text-left p-3 rounded-2xl bg-card text-card-foreground border border-border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:border-accent active:translate-y-0 min-h-22 cursor-pointer"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <span
          className="w-3 h-3 rounded-sm shrink-0 mt-1"
          style={{ background: info.color }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-extrabold text-foreground leading-snug m-0 truncate">
            {info.title}
          </h4>
        </div>
        {draggable && (
          <svg
            className="block-drag-handle cursor-grab shrink-0 mt-0.5"
            width={12}
            height={16}
            viewBox="0 0 12 16"
            aria-label={`Déplacer ${info.title}`}
          >
            <g className="fill-text-muted">
              <circle cx={3} cy={2} r={1.3} /><circle cx={9} cy={2} r={1.3} />
              <circle cx={3} cy={8} r={1.3} /><circle cx={9} cy={8} r={1.3} />
              <circle cx={3} cy={14} r={1.3} /><circle cx={9} cy={14} r={1.3} />
            </g>
          </svg>
        )}
        <Badge
          variant="outline"
          className="text-[10px] font-extrabold shrink-0 rounded-full"
          style={{ color: ENGINE_COLORS[info.engine] ?? ENGINE_COLORS.generic }}
        >
          {ENGINE_LABEL[info.engine] ?? ENGINE_LABEL.generic}
        </Badge>
      </div>

      {(info.inputs.length > 0 || info.outputs.length > 0) && (
        <div className="flex flex-col gap-1">
          {info.inputs.map(p => (
            <div key={p.name} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-text-muted font-bold truncate">{p.name}</span>
              <span className="text-text-dim opacity-75 truncate">{p.dtype}</span>
            </div>
          ))}
          {info.outputs.map(p => (
            <div key={p.name} className="flex items-center justify-between gap-2 text-[11px]">
              <span className="text-text font-bold truncate">{p.name}</span>
              <span className="text-text-muted opacity-75 truncate">{p.dtype}</span>
            </div>
          ))}
        </div>
      )}

      {onDelete && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onDelete() }}
          className="block-delete-btn absolute -top-2 -right-2 border-none bg-transparent text-text-muted font-extrabold text-xs cursor-pointer p-0 font-body opacity-0 transition-opacity group-hover/card:opacity-100"
        >
          Supprimer
        </button>
      )}
    </div>
  )
}

export default memo(BlockCard)