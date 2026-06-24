import useAppStore from '../../store/useAppStore'
import HatBlock from '../blocks/HatBlock'
import ScriptBlock from '../blocks/ScriptBlock'
import DropIndicator from './DropIndicator'
import EmptyCanvas from './EmptyCanvas'
import ConsolePanel from '../ui/ConsolePanel'
import DragGhost from '../ui/DragGhost'

const canvasStyle = {
  position: 'absolute', inset: 0, overflow: 'auto', padding: 36,
  background: 'radial-gradient(rgba(255,255,255,.05) 1.4px, transparent 1.4px) 0 0 / 22px 22px, #1b1613',
}

export default function Canvas({ canvasRef, hatRef, blockElsRef, startBlockDrag, bands, hatBand }) {
  const script = useAppStore(s => s.script)
  const drag   = useAppStore(s => s.drag)
  const n      = script.length
  const dropEnd = drag?.active && drag?.overCanvas && drag?.moved && drag?.insertIndex >= n

  return (
    <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
      <div ref={canvasRef} style={canvasStyle}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch', minWidth: 280, paddingBottom: 220 }}>
          <HatBlock hatRef={hatRef} hatBand={hatBand} n={n} band0={bands[0]} />
          {script.map((block, i) => (
            <ScriptBlock
              key={block.id}
              block={block}
              index={i}
              n={n}
              bands={bands}
              hatBand={hatBand}
              blockElsRef={blockElsRef}
              startBlockDrag={startBlockDrag}
            />
          ))}
          {dropEnd && <DropIndicator />}
          {n === 0 && <EmptyCanvas />}
        </div>
      </div>
      <ConsolePanel />
      <DragGhost />
    </div>
  )
}
