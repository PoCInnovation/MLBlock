import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import useAppStore from '../../store/useAppStore'
import { signOut } from '../../services/auth'
import { theme } from '../../theme'

export default function HomeNav() {
  const location     = useLocation()
  const navigate     = useNavigate()
  const user         = useAppStore(s => s.user)
  const setUser      = useAppStore(s => s.setUser)
  const [open, setOpen] = useState(false)
  const navWrapRef = useRef<HTMLDivElement>(null)

  // Fermeture : Échap, tap hors du menu, retour à ≥768px.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    const onPointerDown = (e: PointerEvent) => {
      if (!navWrapRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const onChange = (e: MediaQueryListEvent) => { if (e.matches) setOpen(false) }
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  const scrollToFeatures = () =>
    document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' })

  const handleDecouvrir = () => {
    if (location.pathname === '/') {
      scrollToFeatures()
    } else {
      navigate('/')
      // After navigation the DOM re-renders; scroll on next tick
      setTimeout(scrollToFeatures, 80)
    }
  }

  const linkStyle = (active: boolean): CSSProperties => ({
    fontSize: 15,
    fontWeight: 700,
    color: active ? theme.color.accentLight : theme.color.textMuted,
    cursor: 'pointer',
    borderBottom: active ? `2px solid ${theme.color.accentLight}` : '2px solid transparent',
    paddingBottom: 2,
    transition: 'color .15s, border-color .15s',
  })

  // Ferme le menu mobile puis exécute l'action du lien
  const go = (fn: () => void) => { setOpen(false); fn() }

  const handleAuth = () => {
    go(() => {
      if (user) {
        void (async () => { try { await signOut() } catch {} setUser(null); navigate('/') })()
      } else {
        navigate('/login')
      }
    })
  }

  const menuLinkStyle: CSSProperties = {
    display: 'block', width: '100%', background: 'none', border: 'none',
    textAlign: 'left', padding: '14px 20px', fontSize: 15, fontWeight: 700,
    color: theme.color.text, cursor: 'pointer',
  }

  return (
    <div ref={navWrapRef}>
      <nav className="landing-nav" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '22px 48px', maxWidth: 1240, margin: '0 auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          <div
            onClick={() => navigate('/')}
            style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: theme.color.accent, boxShadow: theme.shadow.btn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 13, height: 13, background: '#fff', borderRadius: 4 }} />
            </div>
            <span style={{ fontFamily: theme.font.heading, fontWeight: 600, fontSize: 23, letterSpacing: '-.01em' }}>MLBlock</span>
          </div>
        </div>
        <div className="landing-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 30 }}>
          <button onClick={handleDecouvrir} style={{ ...linkStyle(false), background: 'none', border: 'none' }}>Découvrir</button>
          <button onClick={() => navigate('/how-it-works')} style={{ ...linkStyle(location.pathname === '/how-it-works'), background: 'none', border: 'none' }}>Comment ça marche</button>
          <button onClick={() => navigate('/about')} style={{ ...linkStyle(location.pathname === '/about'), background: 'none', border: 'none' }}>Qui sommes nous</button>
          <button
            onClick={() => navigate('/projets')}
            style={{ background: theme.color.accent, color: '#fff', border: 'none', padding: '11px 20px', borderRadius: 12, fontWeight: 800, fontSize: 15, cursor: 'pointer', boxShadow: theme.shadow.btn }}
          >
            Mes projets
          </button>
          {user ? (
            <button onClick={handleAuth} style={{ background: theme.color.border, color: theme.color.textMuted, border: 'none', padding: '11px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Déconnexion
            </button>
          ) : (
            <button onClick={handleAuth} style={{ background: theme.color.border, color: theme.color.textMuted, border: 'none', padding: '11px 20px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Connexion
            </button>
          )}
        </div>
        {/* Hamburger : visible uniquement <768px (cf. index.css). */}
        <button
          className="landing-nav-burger"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>
      {/* Menu mobile repliable : se ferme au tap sur un lien. */}
      {open && (
        <div className="landing-nav-menu">
          <button onClick={() => go(handleDecouvrir)} style={menuLinkStyle}>Découvrir</button>
          <button onClick={() => go(() => navigate('/how-it-works'))} style={menuLinkStyle}>Comment ça marche</button>
          <button onClick={() => go(() => navigate('/about'))} style={menuLinkStyle}>Qui sommes nous</button>
          <button onClick={() => go(() => navigate('/projets'))} style={{ ...menuLinkStyle, color: theme.color.accentLight }}>Mes projets</button>
          <button onClick={handleAuth} style={menuLinkStyle}>{user ? 'Déconnexion' : 'Connexion'}</button>
        </div>
      )}
    </div>
  )
}
