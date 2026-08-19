import type { ReactNode } from 'react'
import HomeNav from './HomeNav'
import HomeFooter from './HomeFooter'
import SkipLink from '../ui/SkipLink'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <SkipLink />
      <HomeNav />
      <main id="main">{children}</main>
      <HomeFooter />
    </div>
  )
}
