import { memo, useRef, useEffect, useState } from 'react'
import { theme } from '../../theme'
import useAppStore from '../../store/useAppStore'
import ResultsPanel from './ResultsPanel'
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react'

const COLORS: Record<string, string> = { sys: 'var(--color-text)', info: 'var(--color-info)', ok: 'var(--color-success-muted)', epoch: 'var(--color-warning)' }

const ConsolePanel = memo(function ConsolePanel() {
  const consoleLines = useAppStore(s => s.consoleLines)
  const jobStatus    = useAppStore(s => s.jobStatus)
  const [tab, setTab] = useState<'console' | 'results'>('console')
  const [collapsed, setCollapsed] = useState(false)
  const scrollRef    = useRef<HTMLDivElement>(null)

  const active = jobStatus === 'queued' || jobStatus === 'dispatched' || jobStatus === 'running'
  const done   = jobStatus === 'done'

  useEffect(() => {
    if (active && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [consoleLines, active, collapsed])

  // Console still renders empty placeholder when no lines — floating panel
  // stays visible (no crash), only content area empty.

  return (
    <div className="console-panel floating-panel console-collapsible" style={{
      background: 'var(--color-console)', border: '1px solid rgba(255,255,255,.09)',
      borderRadius: theme.radius.xl, boxShadow: '0 8px 32px rgba(0,0,0,.12)',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      height: collapsed ? 48 : 180,
      opacity: 1,
      transition: 'height 200ms ease, opacity 200ms ease, transform 200ms ease',
      willChange: 'height, opacity, transform',
      flexShrink: 0,
    }}>
      <div className="console-header" style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,.07)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? theme.color.warning : theme.color.status, animation: active ? 'mlbBlink 1s ease-in-out infinite' : 'none', display: 'inline-block' }} />
          <span style={{ fontWeight: 800, fontSize: 13.5, letterSpacing: '.02em' }}>Ce qui se passe</span>
          <button
            onClick={() => setCollapsed(c => !c)}
            aria-label={collapsed ? 'Déplier la console' : 'Replier la console'}
            title={collapsed ? 'Déplier' : 'Replier'}
            style={{
              background: 'transparent', border: 'none', color: theme.color.textMuted,
              cursor: 'pointer', width: 44, height: 44, marginLeft: 4,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 999,
            }}
          >
            {collapsed ? <ChevronUp size={17} /> : <ChevronDown size={17} />}
          </button>
        </div>
        {!collapsed && (
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
                  minHeight: 44, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {t === 'console' ? 'Console' : 'Résultats'}
              </button>
            ))}
          </div>
        )}
        {!collapsed && done && (
          <div style={{ background: 'rgba(143,209,168,.16)', border: '1px solid rgba(143,209,168,.4)', color: 'var(--color-success-muted)', padding: '5px 12px', borderRadius: 999, fontWeight: 800, fontSize: 13 }}>
            <CheckCircle2 size={14} /> Terminé
          </div>
        )}
      </div>
      {!collapsed && (tab === 'results' ? (
        <ResultsPanel />
      ) : (
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-label="Sortie de la console"
          style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', fontFamily: 'ui-monospace, monospace', fontSize: 13, lineHeight: 1.7, opacity: 1, transition: 'opacity 200ms ease' }}
        >
          {consoleLines.length === 0 ? (
            <div style={{ color: theme.color.textMuted, fontStyle: 'italic' }}>Aucune sortie — lance un pipeline pour voir les logs.</div>
          ) : (
            consoleLines.map((line, i) => (
              <div key={i} style={{ color: COLORS[line.k] || '#a89f97' }}>{line.t}</div>
            ))
          )}
        </div>
      ))}
    </div>
  )
})

export default ConsolePanel
