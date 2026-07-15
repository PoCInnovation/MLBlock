import type { ReactNode } from 'react'
import HomeNav from './HomeNav'
import HomeFooter from './HomeFooter'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', background: '#171311', color: '#f0e9e3' }}>
      <HomeNav />
      {children}
      <HomeFooter />
    </div>
  )
}
