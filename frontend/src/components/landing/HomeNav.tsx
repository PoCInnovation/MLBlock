import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { Menu, X } from 'lucide-react'
import { Icon } from '@astryxdesign/core/Icon'
import useAppStore from '../../store/useAppStore'
import { signOut } from '../../services/auth'
import { Button, HStack } from '@astryxdesign/core'

const NAV_LINK_BASE = 'bg-transparent border-none cursor-pointer text-sm font-bold pb-0.5 border-b-2 transition-colors duration-150'

function navLinkClass(active: boolean) {
  return `${NAV_LINK_BASE} ${active ? 'text-accent-light border-accent-light' : 'text-text-muted border-transparent'}`
}

const MENU_LINK = 'block w-full bg-transparent border-none text-left px-5 py-3.5 text-sm font-bold text-text cursor-pointer'

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

  return (
    <div ref={navWrapRef}>
      <nav className="landing-nav flex items-center justify-between px-12 py-5.5 max-w-310 mx-auto">
        <div className="flex items-center gap-2.5">
          <div
            onClick={() => navigate({ to: '/' })}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <div className="w-8.5 h-8.5 rounded-md bg-accent shadow-btn flex items-center justify-center">
              <div className="w-3.25 h-3.25 bg-white rounded-xs" />
            </div>
            <span className="font-heading font-semibold text-2xl tracking-tight">MLBlock</span>
          </div>
        </div>
        <HStack gap={4} className="landing-nav-links items-center">
          <button onClick={handleDecouvrir} className={navLinkClass(false)}>Découvrir</button>
          <button onClick={() => navigate({ to: '/cours' })} className={navLinkClass(location.pathname.startsWith('/cours'))}>Cours</button>
          <button onClick={() => navigate({ to: '/how-it-works' })} className={navLinkClass(location.pathname === '/how-it-works')}>Comment ça marche</button>
          <button onClick={() => navigate({ to: '/about' })} className={navLinkClass(location.pathname === '/about')}>Qui sommes nous</button>
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
          <button onClick={() => go(handleDecouvrir)} className={MENU_LINK}>Découvrir</button>
          <button onClick={() => go(() => navigate({ to: '/cours' }))} className={MENU_LINK}>Cours</button>
          <button onClick={() => go(() => navigate({ to: '/how-it-works' }))} className={MENU_LINK}>Comment ça marche</button>
          <button onClick={() => go(() => navigate({ to: '/about' }))} className={MENU_LINK}>Qui sommes nous</button>
          <button onClick={() => go(() => navigate({ to: '/projets' }))} className={`${MENU_LINK} text-accent-light`}>Mes projets</button>
          <button onClick={handleAuth} className={MENU_LINK}>{user ? 'Déconnexion' : 'Connexion'}</button>
        </div>
      )}
    </div>
  )
}
