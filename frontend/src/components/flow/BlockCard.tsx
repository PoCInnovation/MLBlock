import { memo, useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import useAppStore from '../../store/useAppStore'
import { blockCardInfo } from '../../utils/superblocks'



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
      className={`group/card relative flex flex-col w-full text-left rounded-2xl overflow-hidden bg-card text-card-foreground border border-border shadow-sm transition-all min-h-22 ${
        draggable ? '' : 'cursor-pointer hover:-translate-y-0.5 hover:shadow-lg hover:border-accent active:translate-y-0'
      }`}
    >
      {/* Poignée de déplacement (drag handle) au-dessus du texte sur toute la largeur */}
      {draggable && (
        <div
          className="block-drag-handle cursor-grab active:cursor-grabbing w-full h-6 shrink-0 transition-opacity hover:opacity-95 flex items-center justify-center border-b border-black/10 dark:border-white/10"
          style={{ backgroundColor: info.categoryColor }}
          title={`Déplacer ${info.title}`}
          aria-label={`Déplacer ${info.title}`}
        >
          <div className="w-10 h-1 rounded-full bg-white/50 shadow-xs" />
        </div>
      )}

      <div className={`flex items-start gap-3 px-4 ${draggable ? 'pt-3' : 'pt-4'} pb-3`}>
        <span
          className="w-3.5 h-3.5 rounded-sm shrink-0 mt-1"
          style={{ background: info.categoryColor }}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-extrabold text-foreground leading-snug m-0 truncate">
            {info.title}
          </h4>
        </div>
        <Badge
          variant="outline"
          className="text-[10px] font-extrabold shrink-0 rounded-full border-[color:var(--cat-color)] bg-[color:var(--cat-color)]/10 text-foreground dark:text-[color:var(--cat-color)]"
          style={{ '--cat-color': info.categoryColor } as React.CSSProperties}
        >
          {info.badge}
        </Badge>

        {onDelete && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); onDelete() }}
            aria-label={`Supprimer ${info.title}`}
            className="block-delete-btn shrink-0 border-none bg-transparent text-text-muted hover:text-destructive cursor-pointer p-1 text-xs font-extrabold opacity-0 transition-opacity focus-visible:opacity-100 group-hover/card:opacity-100 rounded-md min-w-[32px] min-h-[32px] inline-flex items-center justify-center"
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