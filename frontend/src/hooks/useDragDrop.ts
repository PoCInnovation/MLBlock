import { useEffect, useCallback } from 'react'
import useAppStore from '../store/useAppStore'
import { colorFor, titleOf } from '../utils/blockHelpers'

type Params = {
  blockElsRef: React.MutableRefObject<Record<string, HTMLElement>>
  canvasRef: React.RefObject<HTMLElement | null>
}

export function useDragDrop({ blockElsRef, canvasRef }: Params) {
  const computeInsertIndex = useCallback((clientY: number): number => {
    const { script } = useAppStore.getState()
    let insertIndex = script.length
    for (let i = 0; i < script.length; i++) {
      const el = blockElsRef.current[script[i].id]
      if (!el) continue
      const br = el.getBoundingClientRect()
      if (clientY < br.top + br.height / 2) { insertIndex = i; break }
    }
    return insertIndex
  }, [blockElsRef])

  const startPaletteDrag = useCallback((type: string, e: React.PointerEvent): void => {
    if (e.button != null && e.button !== 0) return
    e.preventDefault()
    const catalog = useAppStore.getState().catalog
    const d = catalog?.blocks[type]
    useAppStore.getState().setDrag({
      active: true, source: 'palette', type,
      sx: e.clientX, sy: e.clientY,
      x: e.clientX, y: e.clientY,
      insertIndex: useAppStore.getState().script.length,
      overCanvas: false, moved: false,
      color: d && catalog ? colorFor(d.cat, catalog.categories) : '#888',
      label: d && catalog ? titleOf(type, catalog.blocks) : type,
    })
  }, [])

  const startBlockDrag = useCallback((id: string, e: React.PointerEvent): void => {
    const tag = (e.target as HTMLElement).tagName
    if (['INPUT', 'SELECT', 'OPTION', 'BUTTON', 'TEXTAREA'].includes(tag)) return
    e.preventDefault()
    const { script } = useAppStore.getState()
    const b = script.find(x => x.id === id)
    if (!b) return
    const catalog = useAppStore.getState().catalog
    const d = catalog?.blocks[b.type]
    useAppStore.getState().setDrag({
      active: true, source: 'script', id, type: b.type,
      sx: e.clientX, sy: e.clientY,
      x: e.clientX, y: e.clientY,
      insertIndex: script.length,
      overCanvas: true, moved: false,
      color: d && catalog ? colorFor(d.cat, catalog.categories) : '#888',
      label: d && catalog ? titleOf(b.type, catalog.blocks) : b.type,
    })
  }, [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = useAppStore.getState().drag
      if (!d || !d.active) return
      const moved = d.moved || Math.abs(e.clientX - d.sx) > 4 || Math.abs(e.clientY - d.sy) > 4
      let overCanvas = false
      if (canvasRef.current) {
        const r = canvasRef.current.getBoundingClientRect()
        overCanvas = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      }
      const insertIndex = overCanvas ? computeInsertIndex(e.clientY) : useAppStore.getState().script.length
      if (d.source === 'palette') {
        useAppStore.getState().setDrag({ ...d, x: e.clientX, y: e.clientY, moved, overCanvas, insertIndex })
      } else {
        useAppStore.getState().setDrag({ ...d, x: e.clientX, y: e.clientY, moved, overCanvas, insertIndex })
      }
    }

    const onUp = () => {
      const d = useAppStore.getState().drag
      if (!d || !d.active) return
      const { addBlock, moveBlock, deleteBlock } = useAppStore.getState()
      if (d.source === 'palette') {
        if (d.overCanvas) addBlock(d.type, d.insertIndex)
        else if (!d.moved) addBlock(d.type, null)
      } else if (d.source === 'script') {
        if (d.overCanvas) moveBlock(d.id, d.insertIndex)
        else if (d.moved) deleteBlock(d.id)
      }
      useAppStore.getState().clearDrag()
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
  }, [canvasRef, computeInsertIndex])

  return { startPaletteDrag, startBlockDrag }
}
