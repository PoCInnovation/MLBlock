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
      className={`group/card relative flex flex-col w-full text-left rounded-2xl bg-card text-card-foreground border border-border shadow-sm transition-all min-h-22 ${
        draggable ? '' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-accent active:translate-y-0'
      }`}
    >
      {/* Tout le bandeau du haut sert de poignée : on déplace le bloc par son titre. */}
      <div className={`flex items-start gap-3 p-4 pb-3 ${draggable ? 'block-drag-handle cursor-grab' : ''}`}>
        <span
          className="w-3.5 h-3.5 rounded-sm shrink-0 mt-1"
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
            className="shrink-0 mt-0.5 opacity-60"
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
        {onDelete && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete() }}
            aria-label={`Supprimer ${info.title}`}
            className="block-delete-btn shrink-0 border-none bg-transparent text-text-muted hover:text-destructive cursor-pointer p-0 text-xs font-extrabold opacity-0 transition-opacity focus-visible:opacity-100 group-hover/card:opacity-100"
          >
            Supprimer
          </button>
        )}
      </div>

      {(info.inputs.length > 0 || info.outputs.length > 0) && (
        <div className="flex flex-col gap-1.5 px-4 pb-4 pt-0.5">
          {info.inputs.map(p => (
            <div key={p.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-text-muted font-bold truncate">{p.name}</span>
              <span className="text-text-dim opacity-70 font-mono truncate">{p.dtype}</span>
            </div>
          ))}
          {info.outputs.map(p => (
            <div key={p.name} className="flex items-center justify-between gap-3 text-xs">
              <span className="text-text font-bold truncate">{p.name}</span>
              <span className="text-text-muted opacity-70 font-mono truncate">{p.dtype}</span>
            </div>
          ))}
        </div>
      )}
      {info.inputs.length === 0 && info.outputs.length === 0 && <div className="px-4 pb-4" />}
    </div>
  )
}

export default memo(BlockCard)