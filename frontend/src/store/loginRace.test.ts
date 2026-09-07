import { describe, it, expect, beforeEach, vi } from 'vitest'
import useAppStore from './useAppStore'

// Regression for diagnosing-bugs: login race where navigate happened before store update
// Bug: LoginPage onSubmit did navigate({to:'/projets'}) without setting store, so
// projets.tsx beforeLoad saw user=null and redirected back to /login.
// Fix: LoginPage must setUser(data.user) synchronously before navigate.

describe('login race — setUser before navigate', () => {
  beforeEach(() => {
    useAppStore.setState({ user: null })
  })

  it('store user is null before login', () => {
    expect(useAppStore.getState().user).toBeNull()
  })

  it('setting user synchronously makes guard pass', () => {
    const mockUser = { id: 'u1', email: 'a@b.c' }
    // Simulate fixed onSubmit: setUser then check guard
    useAppStore.getState().setUser(mockUser)
    const user = useAppStore.getState().user
    expect(user).toEqual(mockUser)
    // projets beforeLoad logic: if (!user) throw redirect
    const wouldRedirect = !user
    expect(wouldRedirect).toBe(false)
  })

  it('without setUser guard would redirect (bug)', () => {
    // Simulate buggy onSubmit: navigate without setUser
    const mockUser = { id: 'u1', email: 'a@b.c' }
    // Bug: not calling setUser
    void mockUser // intentionally not setting
    const user = useAppStore.getState().user
    expect(user).toBeNull()
    const wouldRedirect = !user
    expect(wouldRedirect).toBe(true) // bug: would bounce to /login
  })

  it('fixed flow: signIn success → setUser → guard passes', async () => {
    const mockSignIn = vi.fn(async () => ({
      data: { user: { id: 'u1', email: 'chedli.ouazizpro@gmail.com' }, session: { user: { id: 'u1' } } },
      error: null,
    }))
    const { data } = await mockSignIn()
    useAppStore.getState().setUser(data.user ?? null)
    expect(useAppStore.getState().user).not.toBeNull()
    // Simulate navigate + beforeLoad check
    expect(useAppStore.getState().user).toBeTruthy()
  })
})
