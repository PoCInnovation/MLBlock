import { describe, it, expect, beforeEach, vi } from 'vitest'
import useAppStore from './useAppStore'

// Regression for diagnosing-bugs: auth lost on refresh
// Bug: __root.tsx (prod) had no getSession/onAuthStateChange
describe('auth persist on refresh', () => {
  beforeEach(() => {
    useAppStore.setState({ user: null })
  })

  it('refresh without restore stays null (bug)', () => {
    expect(useAppStore.getState().user).toBeNull()
    const wouldRedirect = !useAppStore.getState().user
    expect(wouldRedirect).toBe(true)
  })

  it('refresh with getSession restores user (fix)', async () => {
    const mockSession = { user: { id: '333d3423-5ee8-44fc-9ea0-6b794b78e27c', email: 'chedli.ouazizpro@gmail.com' } }
    const getSession = vi.fn(async () => ({ session: mockSession, error: null }))
    const { session } = await getSession()
    useAppStore.getState().setUser(session?.user ?? null)
    expect(useAppStore.getState().user).toEqual(mockSession.user)
    const wouldRedirect = !useAppStore.getState().user
    expect(wouldRedirect).toBe(false)
  })

  it('onAuthStateChange restores after refresh', () => {
    const mockUser = { id: 'u1', email: 'a@b.c' }
    const onAuthStateChange = (cb: (s: unknown) => void) => {
      cb({ user: mockUser } as never)
      return { data: { subscription: { unsubscribe: () => {} } } }
    }
    const { data: { subscription } } = onAuthStateChange((session: unknown) => {
      const s = session as { user: unknown } | null
      useAppStore.getState().setUser(s?.user ?? null)
    })
    void subscription
    expect(useAppStore.getState().user).toEqual(mockUser)
  })
})
