import { memo, useState } from 'react'
import type { NodeProps } from 'reactflow'
import { Copy, MoreVertical, MoveRight, Trash2, Pencil } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import { COL_PAD, HEADER_H, colOf } from '../../utils/gridLayout'
import { Card, CardHeader, CardTitle, CardAction, CardContent, CardFooter } from '../ui/card'
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
  const selectedCol = useAppStore(s => s.selectedCol)
  const setSelectedCol = useAppStore(s => s.setSelectedCol)
  const renameColumn = useAppStore(s => s.renameColumn)
  const duplicateColumn = useAppStore(s => s.duplicateColumn)
  const removeColumn = useAppStore(s => s.removeColumn)
  const moveColumnTo = useAppStore(s => s.moveColumnTo)
  const showToast = useAppStore(s => s.showToast)

  const [editing, setEditing] = useState(false)
  const [draftLabel, setDraftLabel] = useState('')
  const [moveOpen, setMoveOpen] = useState(false)

  const selected = selectedCol === id
  const blockCount = flowNodes.filter(n => colOf(n) === data.index).length

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
    <Card
      size="sm"
      className="nodrag"
      onClick={() => setSelectedCol(selected ? null : id)}
      title={selected ? 'Colonne cible du dépôt' : 'Sélectionner comme colonne cible'}
      style={{
        width: '100%',
        height: '100%',
        // ReactFlow met pointer-events:none sur les nœuds non interactifs —
        // sans 'all', le dropdown/renommage/sélection ne reçoivent aucun clic.
        pointerEvents: 'all',
        cursor: 'pointer',
        background: selected ? 'rgba(217,119,87,.07)' : theme.color.surface3,
        border: `2px solid ${selected ? 'rgba(217,119,87,.65)' : theme.color.border}`,
        boxShadow: selected ? `0 0 0 3px rgba(217,119,87,.22), ${theme.shadow.block}` : theme.shadow.block,
      }}
    >
      {/* CardHeader : titre (renommable) + actions */}
      <CardHeader
        onClick={e => e.stopPropagation()}
        style={{
          margin: '0 -10px',
          padding: '10px 12px',
          minHeight: HEADER_H,
          alignItems: 'center',
          gap: 8,
          background: selected ? 'rgba(217,119,87,.16)' : theme.color.surface2,
          borderBottom: `2px solid ${theme.color.border}`,
        }}
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
            style={{
              minWidth: 0,
              background: theme.color.inputBg,
              border: `1px solid ${theme.color.auth}`,
              borderRadius: theme.radius.sm,
              outline: 'none',
              color: theme.color.text,
              fontWeight: 800,
              fontSize: 12.5,
              padding: '3px 6px',
            }}
          />
        ) : (
          <CardTitle
            onClick={() => { setDraftLabel(data.column.label); setEditing(true) }}
            title="Cliquer pour renommer"
            style={{
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              cursor: 'text',
              borderBottom: '1px dashed rgba(255,255,255,.22)',
              padding: '2px 0',
            }}
          >
            {data.column.label}
          </CardTitle>
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
                  style={{
                    border: 'none',
                    background: 'rgba(255,255,255,.07)',
                    borderRadius: theme.radius.sm,
                    color: theme.color.textMuted,
                    width: 24,
                    height: 24,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                    padding: 0,
                  }}
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
                    <div style={{ padding: '8px 12px', fontSize: 12.5, color: theme.color.textDim }}>
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
        style={{ margin: '0 -10px', padding: '6px 12px', letterSpacing: '.03em' }}
      >
        {blockCount} bloc{blockCount > 1 ? 's' : ''}
      </CardFooter>
    </Card>
  )
}

export default memo(ColumnNode)
