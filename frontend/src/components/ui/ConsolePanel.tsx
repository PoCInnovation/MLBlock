import { useRef, useEffect, useState } from 'react'
import { theme } from '../../theme'
import useAppStore from '../../store/useAppStore'
import ResultsPanel from './ResultsPanel'
import { CheckCircle2 } from 'lucide-react'

const COLORS: Record<string, string> = { sys: '#f0e9e3', info: '#9aa0c4', ok: '#8fd1a8', epoch: '#E8C77A' }

export default function ConsolePanel() {
  const consoleLines = useAppStore(s => s.consoleLines)
  // Sélecteur minimal : le statut du run est synchronisé dans le store par le
  // suivi du job (useBlockRunner) — plus de flag d'exécution côté store.
  const jobStatus    = useAppStore(s => s.jobStatus)
  const [tab, setTab] = useState<'console' | 'results'>('console')
  const scrollRef    = useRef<HTMLDivElement>(null)

  // Job en cours d'exécution (suivi actif) : indicateur + autoscroll.
  const active = jobStatus === 'queued' || jobStatus === 'dispatched' || jobStatus === 'running'
  const done   = jobStatus === 'done'

  useEffect(() => {
    if (active && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [consoleLines, active])

  if (consoleLines.length === 0) return null

  return (
    <div style={{
      position: 'absolute', left: 18, right: 18, bottom: 18, height: 196,
      background: '#120f0d', border: '1px solid rgba(255,255,255,.09)',
      borderRadius: 16, boxShadow: '0 20px 50px rgba(0,0,0,.45)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? theme.color.warning : theme.color.status, animation: active ? 'mlbBlink 1s ease-in-out infinite' : 'none', display: 'inline-block' }} />
          <span style={{ fontWeight: 800, fontSize: 13.5, letterSpacing: '.02em' }}>Ce qui se passe</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,.05)', border: '1px solid rgba(255,255,255,.08)', padding: 3, borderRadius: 999 }}>
          {(['console', 'results'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                background: tab === t ? theme.color.surface3 : 'transparent',
                color: tab === t ? theme.color.text : theme.color.textMuted,
                border: 'none', padding: '4px 12px', borderRadius: 999,
                fontWeight: 800, fontSize: 12.5, cursor: 'pointer',
              }}
            >
              {t === 'console' ? 'Console' : 'Résultats'}
            </button>
          ))}
        </div>
        {done && (
          <div style={{ background: 'rgba(143,209,168,.16)', border: '1px solid rgba(143,209,168,.4)', color: '#8fd1a8', padding: '5px 12px', borderRadius: 999, fontWeight: 800, fontSize: 13 }}>
            <CheckCircle2 size={14} /> Terminé
          </div>
        )}
      </div>
      {tab === 'results' ? (
        <ResultsPanel />
      ) : (
        <div
          ref={scrollRef}
          style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.7 }}
        >
          {consoleLines.map((line, i) => (
            <div key={i} style={{ color: COLORS[line.k] || '#a89f97' }}>{line.t}</div>
          ))}
        </div>
      )}
    </div>
  )
}
