import type { ReactNode } from 'react'
import HomeNav from './HomeNav'
import HomeFooter from './HomeFooter'
import SkipLink from '../ui/SkipLink'
import { Stack } from '@astryxdesign/core'

export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <Stack direction="vertical" gap={0} style={{ minHeight: '100vh', background: 'var(--color-bg)', color: 'var(--color-text)' }}>
      <SkipLink />
      <HomeNav />
      <main id="main" style={{ flex: 1 }}>{children}</main>
      <HomeFooter />
    </Stack>
  )
}
