import type { ReactNode } from 'react'
import HomeNav from './HomeNav'
import HomeFooter from './HomeFooter'
import SkipLink from '../ui/SkipLink'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <SkipLink />
      <HomeNav />
      <main id="main" className="flex-1">{children}</main>
      <HomeFooter />
    </div>
  )
}
