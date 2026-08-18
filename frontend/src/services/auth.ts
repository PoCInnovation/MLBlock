import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  return { data, error }
}

export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({ email })
  return { data, error }
}

export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
  return { data, error }
}

export async function signInWithMicrosoft() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'azure',
    options: { scopes: 'email' },
  })
  return { data, error }
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email, password })
  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function getSession() {
  const { data, error } = await supabase.auth.getSession()
  return { session: data.session, error }
}

export function onAuthStateChange(callback: (session: Session | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => callback(session))
}
