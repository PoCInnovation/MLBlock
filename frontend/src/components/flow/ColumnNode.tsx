import { memo, useState } from 'react'
import type { NodeProps } from 'reactflow'
import { ArrowLeft, Copy, MoreVertical, MoveRight, Trash2, Pencil } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import { COL_PAD, colOf } from '../../utils/gridLayout'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/dropdown-menu'

type ColumnNodeData = {
  column: { id: string; label: string }
  index: number
  height: number
}

/** Colonne de la vue grille : grande carte (Card) en arrière-plan du canvas. */
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
  const [moveMode, setMoveMode] = useState(false)

  const selected = selectedCol === id
  const blockCount = flowNodes.filter(n => colOf(n) === data.index).length

  const commitLabel = () => {
    const label = draftLabel.trim()
    if (label && label !== data.column.label) renameColumn(id, label)
    setEditing(false)
  }

  const handleRemove = () => {
    if (!removeColumn(id)) {
      showToast({ kind: 'error', message: 'Impossible : déplace d’abord les blocs de cette colonne' })
    }
  }

  const otherColumns = columns
    .map((c, i) => ({ ...c, i }))
    .filter(c => c.id !== id)

  return (
    <div
      onClick={() => setSelectedCol(selected ? null : id)}
      // ReactFlow consomme le pointerdown des nœuds non-draggable (gesture de
      // pan → preventDefault → le click natif n'arrive jamais : boutons et
      // renommage inaccessibles). On stoppe la propagation au niveau de la
      // colonne pour laisser le click natif se produire.
      onPointerDown={e => e.stopPropagation()}
      title={selected ? 'Colonne cible du dépôt' : 'Sélectionner comme colonne cible'}
      style={{
        width: '100%',
        height: '100%',
        // ReactFlow met pointer-events:none sur les wrappers des nœuds non
        // interactifs (draggable/selectable/focusable false) — hérité par
        // tout le contenu : sans ce 'all', le dropdown, le renommage et la
        // sélection de colonne ne reçoivent aucun clic.
        pointerEvents: 'all',
        display: 'flex',
        flexDirection: 'column',
        background: selected ? 'rgba(217,119,87,.07)' : theme.color.surface3,
        border: `2px solid ${selected ? 'rgba(217,119,87,.65)' : theme.color.border}`,
        borderRadius: theme.radius.lg,
        boxShadow: selected ? `0 0 0 3px rgba(217,119,87,.22), ${theme.shadow.block}` : theme.shadow.block,
        boxSizing: 'border-box',
        overflow: 'hidden',
        cursor: 'pointer',
      }}
    >
      {/* CardHeader : titre (renommable) + actions */}
      <div
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          padding: '10px 12px',
          background: selected ? 'rgba(217,119,87,.16)' : theme.color.surface2,
          borderBottom: `2px solid ${theme.color.border}`,
          flexShrink: 0,
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
              flex: 1,
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
          <span
            onClick={() => { setDraftLabel(data.column.label); setEditing(true) }}
            title="Cliquer pour renommer"
            style={{
              flex: 1,
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontWeight: 800,
              fontSize: 12.5,
              color: theme.color.textLight,
              borderBottom: '1px dashed rgba(255,255,255,.22)',
              cursor: 'text',
              padding: '2px 0',
            }}
          >
            {data.column.label}
          </span>
        )}
        <DropdownMenu onOpenChange={open => { if (!open) setMoveMode(false) }}>
          <DropdownMenuTrigger
            render={
              <button
                aria-label="Menu de la colonne"
                title="Gérer la colonne"
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
            {moveMode ? (
              <>
                <DropdownMenuItem onClick={() => setMoveMode(false)}>
                  <ArrowLeft size={14} /> Retour
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {otherColumns.length === 0 && (
                  <div style={{ padding: '8px 12px', fontSize: 12.5, color: theme.color.textDim }}>
                    Aucune autre colonne
                  </div>
                )}
                {otherColumns.map(c => (
                  <DropdownMenuItem
                    key={c.id}
                    onClick={() => {
                      moveColumnTo(id, c.i)
                      setMoveMode(false)
                    }}
                  >
                    <MoveRight size={14} /> Vers « {c.label} »
                  </DropdownMenuItem>
                ))}
              </>
            ) : (
              <>
                <DropdownMenuItem onClick={() => duplicateColumn(id)}>
                  <Copy size={14} /> Dupliquer
                </DropdownMenuItem>
                <DropdownMenuItem destructive onClick={handleRemove}>
                  <Trash2 size={14} /> Supprimer
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setMoveMode(true)}>
                  <MoveRight size={14} /> Déplacer vers ►
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setDraftLabel(data.column.label); setEditing(true) }}>
                  <Pencil size={14} /> Renommer
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {/* CardContent : zone des blocs */}
      <div style={{ flex: 1, minHeight: 0, paddingTop: COL_PAD }} />
      {/* CardFooter : compteur de blocs */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          flexShrink: 0,
          padding: '6px 12px',
          background: theme.color.surface2,
          borderTop: `2px solid ${theme.color.border}`,
          fontSize: 11,
          fontWeight: 800,
          color: theme.color.textMuted,
          letterSpacing: '.03em',
        }}
      >
        {blockCount} bloc{blockCount > 1 ? 's' : ''}
      </div>
    </div>
  )
}

export default memo(ColumnNode)
