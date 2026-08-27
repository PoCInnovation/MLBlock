import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'
import useAppStore from '../../store/useAppStore'
import { signOut } from '../../services/auth'
import { theme } from '../../theme'
import { Button, HStack } from '@astryxdesign/core'

export default function HomeNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const user = useAppStore(s => s.user)
  const setUser = useAppStore(s => s.setUser)
  const [open, setOpen] = useState(false)
  const navWrapRef = useRef<HTMLDivElement>(null)

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
    const onResize = () => { if (window.innerWidth >= 768) setOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const scrollToFeatures = () =>
    document.getElementById('fonctionnalites')?.scrollIntoView({ behavior: 'smooth' })

  const handleDecouvrir = () => {
    if (location.pathname === '/') {
      scrollToFeatures()
    } else {
      navigate({ to: '/' })
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

  const go = (fn: () => void) => { setOpen(false); fn() }

  const handleAuth = () => {
    go(() => {
      if (user) {
        void (async () => { try { await signOut() } catch {} setUser(null); navigate({ to: '/' }) })()
      } else {
        navigate({ to: '/login' })
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
            onClick={() => navigate({ to: '/' })}
            style={{ display: 'flex', alignItems: 'center', gap: 11, cursor: 'pointer' }}
          >
            <div style={{ width: 34, height: 34, borderRadius: 10, background: theme.color.accent, boxShadow: theme.shadow.btn, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: 13, height: 13, background: '#fff', borderRadius: 4 }} />
            </div>
            <span style={{ fontFamily: theme.font.heading, fontWeight: 600, fontSize: 23, letterSpacing: '-.01em' }}>MLBlock</span>
          </div>
        </div>
        <HStack gap={4} style={{ display: 'flex', alignItems: 'center', gap: 30 } as unknown as CSSProperties} className="landing-nav-links">
          <button onClick={handleDecouvrir} style={{ ...linkStyle(false), background: 'none', border: 'none' }}>Découvrir</button>
          <button onClick={() => navigate({ to: '/how-it-works' })} style={{ ...linkStyle(location.pathname === '/how-it-works'), background: 'none', border: 'none' }}>Comment ça marche</button>
          <button onClick={() => navigate({ to: '/about' })} style={{ ...linkStyle(location.pathname === '/about'), background: 'none', border: 'none' }}>Qui sommes nous</button>
          <Button label="Mes projets" variant="primary" size="md" onClick={() => navigate({ to: '/projets' })} />
          <Button label={user ? 'Déconnexion' : 'Connexion'} variant="secondary" size="md" onClick={handleAuth} />
        </HStack>
        <button
          className="landing-nav-burger"
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
        >
          {open ? <Icon icon={X} size="lg" /> : <Icon icon={Menu} size="lg" />}
        </button>
      </nav>
      {open && (
        <div className="landing-nav-menu">
          <button onClick={() => go(handleDecouvrir)} style={menuLinkStyle}>Découvrir</button>
          <button onClick={() => go(() => navigate({ to: '/how-it-works' }))} style={menuLinkStyle}>Comment ça marche</button>
          <button onClick={() => go(() => navigate({ to: '/about' }))} style={menuLinkStyle}>Qui sommes nous</button>
          <button onClick={() => go(() => navigate({ to: '/projets' }))} style={{ ...menuLinkStyle, color: theme.color.accentLight }}>Mes projets</button>
          <button onClick={handleAuth} style={menuLinkStyle}>{user ? 'Déconnexion' : 'Connexion'}</button>
        </div>
      )}
    </div>
  )
}
