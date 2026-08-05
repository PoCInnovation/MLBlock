import useAppStore from '../../store/useAppStore'
import { theme } from '../../theme'
import { buildConversionGraph, classifyEdge, converterFor } from '../../utils/typeCheck'
import type { Block } from '../../utils/blockHelpers'

type Props = {
  prev: Block
  next: Block
  insertIndex: number
}

/** Verdict-colored connector for the implicit chain out_1(N) → in_1(N+1). */
export default function ChainConnector({ prev, next, insertIndex }: Props) {
  const catalog = useAppStore(s => s.catalog)
  const addBlock = useAppStore(s => s.addBlock)

  if (!catalog) return null
  const prevDef = catalog.blocks[prev.type]
  const nextDef = catalog.blocks[next.type]
  if (!prevDef || !nextDef) return null

  const srcDtype = prevDef.outputs[0]?.dtype
  const tgtDtype = nextDef.inputs[0]?.dtype
  if (!srcDtype || !tgtDtype) return null // next block has no data input → no chain

  const graph = buildConversionGraph(catalog.blocks)
  const verdict = classifyEdge(srcDtype, tgtDtype, graph)
  if (verdict === 'compatible') return null // OK — silent

  const color = verdict === 'convertible' ? theme.color.convert : theme.color.error
  const conv = verdict === 'convertible' ? converterFor(srcDtype, tgtDtype, catalog.blocks) : null
  const hint = `${srcDtype} → ${tgtDtype}`

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '4px 0' }}>
      <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} title={hint} />
      {verdict === 'convertible' && conv && (
        <button
          onClick={() => addBlock(conv, insertIndex)}
          style={{
            background: color, color: '#fff', border: 'none', borderRadius: 999,
            padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer',
          }}
        >
          ⚡ Insérer convertisseur ({conv})
        </button>
      )}
      {verdict === 'incompatible' && (
        <span style={{ color, fontSize: 11, fontWeight: 700 }} title={hint}>✗ incompatible ({hint})</span>
      )}
    </div>
  )
}
