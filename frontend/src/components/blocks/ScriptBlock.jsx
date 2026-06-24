import useAppStore from '../../store/useAppStore'
import { defs } from '../../mockdata/blocks'
import { colorFor } from '../../utils/blockHelpers'
import { blockBorderRadius } from '../../utils/snapLogic'
import BlockSegments from './BlockSegments'

const blockBase = {
  position: 'relative', display: 'flex', alignItems: 'center',
  flexWrap: 'wrap', gap: 6, color: '#2a211c', fontWeight: 800,
  fontSize: 14, boxShadow: '0 2px 0 rgba(0,0,0,.18)', userSelect: 'none',
}

export default function ScriptBlock({ block, index, n, bands, hatBand, blockElsRef, startBlockDrag }) {
  const runningId  = useAppStore(s => s.runningId)
  const drag       = useAppStore(s => s.drag)
  const updateField = useAppStore(s => s.updateField)
  const deleteBlock = useAppStore(s => s.deleteBlock)

  const d       = defs[block.type]
  const color   = colorFor(d.cat)
  const isRunning = runningId === block.id
  const dragging  = drag?.source === 'script' && drag?.id === block.id
  const dropHere  = drag?.active && drag?.overCanvas && drag?.moved && drag?.insertIndex === index

  return (
    <div
      ref={el => { if (el) blockElsRef.current[block.id] = el }}
      onPointerDown={e => startBlockDrag(block.id, e)}
      style={{
        ...blockBase,
        background: color,
        padding: '15px 32px 14px 17px',
        borderRadius: blockBorderRadius(index, n, bands, hatBand),
        minWidth: bands[index] != null ? bands[index] + 'px' : undefined,
        marginTop: dropHere ? '34px' : '0px',
        opacity: dragging ? 0.3 : 1,
        cursor: 'grab',
        minHeight: 42,
        zIndex: dragging ? 1000 : (n - index),
        animation: isRunning ? 'mlbGlow .9s ease-in-out infinite' : 'none',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 20, width: 24, height: 11, background: '#1b1613', borderRadius: '0 0 999px 999px' }} />
      {index < n - 1 && (
        <div style={{ position: 'absolute', bottom: -11, left: 20, width: 24, height: 11, background: color, borderRadius: '0 0 999px 999px' }} />
      )}
      <BlockSegments segs={d.segs} fields={block.fields} blockId={block.id} onUpdate={updateField} />
      <button
        onClick={() => deleteBlock(block.id)}
        style={{ position: 'absolute', top: '50%', right: 8, transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'rgba(0,0,0,.16)', color: '#2a211c', fontWeight: 900, fontSize: 13, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
      >×</button>
    </div>
  )
}
