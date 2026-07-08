import { useRef, useEffect } from 'react'
import useAppStore from '../../store/useAppStore'
import { useDragDrop } from '../../hooks/useDragDrop'
import { useBlockWidths } from '../../hooks/useBlockWidths'
import CategoryBar from '../sidebar/CategoryBar'
import BlockPalette from '../sidebar/BlockPalette'
import Canvas from '../canvas/Canvas'

export default function EditorLayout() {
  const script      = useAppStore(s => s.script)
  const blockElsRef = useRef<Record<string, HTMLElement>>({})
  const canvasRef   = useRef<HTMLDivElement>(null)
  const hatRef      = useRef<HTMLDivElement>(null)

  const { startPaletteDrag, startBlockDrag } = useDragDrop({ blockElsRef, canvasRef })
  const { bands, hatBand } = useBlockWidths({ script, blockElsRef, hatRef })

  useEffect(() => {
    const ids = new Set(script.map(b => b.id))
    Object.keys(blockElsRef.current).forEach(id => {
      if (!ids.has(id)) delete blockElsRef.current[id]
    })
  }, [script])

  return (
    <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
      <CategoryBar />
      <BlockPalette startPaletteDrag={startPaletteDrag} />
      <Canvas
        canvasRef={canvasRef}
        hatRef={hatRef}
        blockElsRef={blockElsRef}
        startBlockDrag={startBlockDrag}
        bands={bands}
        hatBand={hatBand}
      />
    </div>
  )
}
