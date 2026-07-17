import type { CSSProperties } from 'react'
import useAppStore from '../../store/useAppStore'

export default function HomeNav() {
  const screen       = useAppStore(s => s.screen)
  const goBuild      = useAppStore(s => s.goBuild)
  const goHome       = useAppStore(s => s.goHome)
  const goHowItWorks = useAppStore(s => s.goHowItWorks)
  const goAbout      = useAppStore(s => s.goAbout)

  const scrollToFeatures = () =>
    document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' })

  const handleDecouvrir = () => {
    if (screen === 'home') {
      scrollToFeatures()
    } else {
      goHome()
      // After navigation the DOM re-renders; scroll on next tick
      setTimeout(scrollToFeatures, 80)
    }
  }

  const linkStyle = (active: boolean): CSSProperties => ({
    fontSize: 15,
    fontWeight: 700,
    color: active ? '#E8915F' : '#b7ada3',
    cursor: 'pointer',
    borderBottom: active ? '2px solid #E8915F' : '2px solid transparent',
    paddingBottom: 2,
    transition: 'color .15s, border-color .15s',
  })

  return (
    <nav className="landing-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 48px', maxWidth: 1240, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
        <div
          onClick={goHome}
          style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}
        >
          <div style={{ width: 34, height: 34, borderRadius: 10, background: '#D97757', boxShadow: '0 3px 0 rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 13, height: 13, background: '#fff', borderRadius: 4 }} />
          </div>
          <span style={{ fontFamily: "'Fredoka', sans-serif", fontWeight: 600, fontSize: 23, letterSpacing: '-.01em' }}>MLBlock</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
        <span onClick={handleDecouvrir} style={linkStyle(false)}>Découvrir</span>
        <span onClick={goHowItWorks} style={linkStyle(screen === 'how-it-works')}>Comment ça marche</span>
        <span onClick={goAbout} style={linkStyle(screen === 'about')}>Qui sommes nous</span>
        <button
          onClick={goBuild}
          style={{ background: '#D97757', color: '#fff', border: 'none', padding: '11px 20px', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: '0 3px 0 rgba(0,0,0,.25)' }}
        >
          Ouvrir l'éditeur
        </button>
      </div>
    </nav>
  )
}
