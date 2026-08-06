import useAppStore from '../../store/useAppStore'
import HatBlock from '../blocks/HatBlock'
import ScriptBlock from '../blocks/ScriptBlock'
import ChainConnector from './ChainConnector'
import DropIndicator from './DropIndicator'
import EmptyCanvas from './EmptyCanvas'
import ConsolePanel from '../ui/ConsolePanel'
import DragGhost from '../ui/DragGhost'
import { Fragment, useEffect, useState } from 'react'
import { resolveColumnsForPath, resolveLinearSourcePath } from '../../utils/columns'

const canvasStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, overflow: 'auto', padding: 36,
  background: 'radial-gradient(rgba(255,255,255,.05) 1.4px, transparent 1.4px) 0 0 / 22px 22px, #1b1613',
}

type CanvasProps = {
  canvasRef: React.RefObject<HTMLDivElement | null>
  hatRef: React.RefObject<HTMLDivElement | null>
  blockElsRef: React.MutableRefObject<Record<string, HTMLElement>>
  startBlockDrag: (id: string, e: React.PointerEvent) => void
  bands: (number | null)[]
  hatBand: number | null
}

export default function Canvas({ canvasRef, hatRef, blockElsRef, startBlockDrag, bands, hatBand }: CanvasProps) {
  const script = useAppStore(s => s.script)
  const drag   = useAppStore(s => s.drag)
  const catalog = useAppStore(s => s.catalog)
  const n      = script.length
  const dropEnd = drag?.active && drag?.overCanvas && drag?.moved && drag?.insertIndex >= n

  // target_column autocomplete: columns of the nearest preceding load_csv
  const [columnOptions, setColumnOptions] = useState<Record<string, Record<string, string[]>>>({})

  useEffect(() => {
    const map: Record<string, Record<string, string[]>> = {}
    const resolvers: Promise<void>[] = []
    script.forEach((b, idx) => {
      const def = catalog?.blocks[b.type]
      const hasTarget = def?.segs.some(s => 'k' in s && s.k === 'target_column')
      if (!hasTarget) return
      const path = resolveLinearSourcePath(script, idx)
      if (!path) return
      resolvers.push(
        resolveColumnsForPath(path).then(cols => {
          if (cols) map[b.id] = { target_column: cols }
        })
      )
    })
    Promise.all(resolvers).then(() => setColumnOptions(map))
  }, [script, catalog])

  return (
    <div style={{ flex: 1, position: 'relative', minWidth: 0 }}>
      <div ref={canvasRef} style={canvasStyle}>
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'stretch', minWidth: 280, paddingBottom: 220 }}>
          <HatBlock hatRef={hatRef} hatBand={hatBand} n={n} band0={bands[0] ?? null} />
          {script.map((block, i) => (
            <Fragment key={block.id}>
              <ScriptBlock
                block={block}
                index={i}
                n={n}
                bands={bands}
                hatBand={hatBand}
                blockElsRef={blockElsRef}
                startBlockDrag={startBlockDrag}
                columnOptions={columnOptions[block.id]}
              />
              {i < n - 1 && <ChainConnector prev={block} next={script[i + 1]} insertIndex={i + 1} />}
            </Fragment>
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
