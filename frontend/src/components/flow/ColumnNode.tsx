import { memo, useState } from 'react'
import type { NodeProps } from 'reactflow'
import { Copy, MoreVertical, MoveRight, Trash2, Pencil } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { COL_PAD, HEADER_H, colOf, rowOf } from '../../utils/gridLayout'
import { Card, CardHeader, CardTitle, CardAction, CardContent, CardFooter } from '../ui/card'
import { HoverCard, HoverCardTrigger, HoverCardContent } from '../ui/hover-card'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '../ui/dropdown-menu'

type ColumnNodeData = {
  column: { id: string; label: string }
  index: number
  height: number
}

/** Colonne de la vue grille : grande carte (Card shadcn) en arrière-plan. */
function ColumnNode({ data, id }: NodeProps<ColumnNodeData>) {
  const columns = useAppStore(s => s.columns)
  const flowNodes = useAppStore(s => s.flowNodes)
  const renameColumn = useAppStore(s => s.renameColumn)
  const duplicateColumn = useAppStore(s => s.duplicateColumn)
  const removeColumn = useAppStore(s => s.removeColumn)
  const moveColumnTo = useAppStore(s => s.moveColumnTo)
  const showToast = useAppStore(s => s.showToast)

  const [editing, setEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState('')
  const [moveOpen, setMoveOpen] = useState(false)

  const blockCount = flowNodes.filter(n => colOf(n) === data.index).length
  const colBlocks = flowNodes
    .filter(n => colOf(n) === data.index)
    .sort((a, b) => rowOf(a) - rowOf(b))

  const commitLabel = () => {
    const label = draftLabel.trim()
    if (label && label !== data.column.label) renameColumn(id, label)
    setEditing(false)
  }

  const handleRemove = () => {
    const isFirst = columns[0]?.id === id
    if (!removeColumn(id)) {
      showToast({
        kind: 'error',
        message: isFirst ? 'La première colonne ne peut pas être supprimée' : 'Impossible : déplace d’abord les blocs de cette colonne',
      })
    }
  }

  const otherColumns = columns
    .map((c, i) => ({ ...c, i }))
    .filter(c => c.id !== id)

  return (
    // ReactFlow met pointer-events:none sur les nœuds non interactifs — sans
    // pointer-events-auto, le dropdown/renommage ne reçoivent aucun clic.
    <Card
      size="sm"
      className="nodrag w-full h-full bg-surface3 border-2! border-border shadow-block pointer-events-auto"
    >
      {/* CardHeader : titre (renommable) + actions */}
      <CardHeader
        onClick={e => e.stopPropagation()}
        className="-mx-3 items-center! gap-2! bg-surface2 border-b-2 border-border px-3! py-2.5!"
        style={{ minHeight: HEADER_H }}
      >
        {editing ? (
          <input
            value={draftLabel}
            autoFocus
            onChange={e => setDraftLabel(e.target.value)}
            onBlur={commitLabel}
            onKeyDown={e => {
              if (e.key === 'Enter') commitLabel()
              if (e.key === 'Escape') setEditing(false)
            }}
            className="min-w-0 bg-input-bg border border-auth rounded-sm focus:ring-2 focus:ring-auth/50 focus:outline-none text-text font-extrabold text-[12.5px] px-1.5 py-[3px]"
          />
        ) : (
          <HoverCard>
            <HoverCardTrigger
              render={
                <CardTitle
                  onClick={() => { setDraftLabel(data.column.label); setEditing(true) }}
                  title="Cliquer pour renommer"
                  className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap cursor-text border-b border-dashed border-white/[.22] py-0.5"
                >
                  {data.column.label}
                </CardTitle>
              }
            />
            <HoverCardContent>
              <div className="font-extrabold text-[13px] mb-0.5">{data.column.label}</div>
              <div className="text-xs text-text-muted" style={{ marginBottom: colBlocks.length ? 8 : 0 }}>
                {blockCount} bloc{blockCount > 1 ? 's' : ''}
              </div>
              {colBlocks.map(n => (
                <div
                  key={n.id}
                  className="text-xs text-text-light py-1 border-t border-border flex items-center gap-[7px]"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-none"
                    style={{ background: (n.data as { categoryColor?: string } | undefined)?.categoryColor ?? 'var(--color-accent)' }}
                  />
                  {(n.data as { label?: string } | undefined)?.label ?? n.id}
                </div>
              ))}
            </HoverCardContent>
          </HoverCard>
        )}
        <CardAction>
          <DropdownMenu open={moveOpen} onOpenChange={open => setMoveOpen(open)}>
            <DropdownMenuTrigger
              render={
                <button
                  aria-label="Menu de la colonne"
                  title="Gérer la colonne"
                  // Le useClick de Base UI (eventOption 'mousedown') ignore le
                  // click quand un pointerdown a précédé : on contrôle le menu
                  // nous-mêmes (open) et on bascule au click natif.
                  onClick={e => { e.stopPropagation(); setMoveOpen(o => !o) }}
                  className="border-none bg-white/[.07] rounded-sm text-text-muted w-6 h-6 flex items-center justify-center cursor-pointer flex-none p-0"
                >
                  <MoreVertical size={14} />
                </button>
              }
            />
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => duplicateColumn(id)}>
                <Copy size={14} /> Dupliquer
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={handleRemove}>
                <Trash2 size={14} /> Supprimer
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <MoveRight size={14} /> Déplacer vers
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {otherColumns.length === 0 && (
                    <div className="px-3 py-2 text-[12.5px] text-text-dim">
                      Aucune autre colonne
                    </div>
                  )}
                  {otherColumns.map(c => (
                    <DropdownMenuItem key={c.id} onClick={() => moveColumnTo(id, c.i)}>
                      Vers « {c.label} »
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setDraftLabel(data.column.label); setEditing(true) }}>
                <Pencil size={14} /> Renommer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      {/* CardContent : zone des blocs */}
      <CardContent style={{ paddingTop: COL_PAD }} />
      {/* CardFooter : compteur de blocs */}
      <CardFooter
        onClick={e => e.stopPropagation()}
        className="-mx-3! px-3! py-1.5! tracking-[.03em]"
      >
        {blockCount} bloc{blockCount > 1 ? 's' : ''}
      </CardFooter>
    </Card>
  )
}

export default memo(ColumnNode)
