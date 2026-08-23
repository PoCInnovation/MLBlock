import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmail, signInWithMagicLink, signInWithGoogle, signInWithMicrosoft } from '../services/auth'
import SiteLayout from '../components/landing/SiteLayout'
import { Field, FieldError, FieldLabel } from '../components/ui/field'
import { loginSchema, type LoginInput } from '../schemas/auth'
import { mapSupabaseError } from '../schemas/errors'

const s: Record<string, string> = {
  wrapper: 'flex items-center justify-center min-h-[60vh] px-5 py-10',
  card: 'bg-surface4 rounded-md p-10 w-full max-w-[400px]',
  title: 'text-2xl font-bold mb-6 text-center text-text',
  input: 'w-full px-3.5 py-2.5 mb-4 rounded-[8px] border border-border bg-input-bg text-text text-sm',
  btn: 'w-full px-3.5 py-2.5 rounded-[8px] border-none text-sm font-semibold cursor-pointer mb-3',
  primaryBtn: 'bg-auth text-white',
  secondaryBtn: 'bg-border text-text',
  divider: 'flex items-center gap-3 my-4 text-divider text-[13px]',
  line: 'flex-1 h-px bg-border',
  error: 'text-error text-[13px] mb-3 text-center',
  link: 'text-[#E8915F] cursor-pointer text-center mt-3 text-sm',
}

const errorId = 'login-email-error'
const pwErrorId = 'login-password-error'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  })
  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form (bibliothèque de formulaires du repo) : watch() non mémoïsable, composant non mémoïsé.
  const email = form.watch('email')

  const onSubmit = async (data: LoginInput) => {
    setError('')
    setLoading(true)
    try {
      const { error: err } = await signInWithEmail(data.email, data.password)
      if (err) setError(mapSupabaseError(err.message))
      else navigate({ to: '/projets' })
    } catch {
      setError(mapSupabaseError('Network request failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleMagicLink = async () => {
    setError('')
    setLoading(true)
    try {
      const { error: err } = await signInWithMagicLink(email)
      if (err) setError(mapSupabaseError(err.message))
      else setMagicSent(true)
    } catch {
      setError(mapSupabaseError('Network request failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = async () => {
    setError('')
    setLoading(true)
    try {
      const { error: err } = await signInWithGoogle()
      if (err) setError(mapSupabaseError(err.message))
    } catch {
      setError(mapSupabaseError('Network request failed'))
    } finally {
      setLoading(false)
    }
  }

  const handleMicrosoft = async () => {
    setError('')
    setLoading(true)
    try {
      const { error: err } = await signInWithMicrosoft()
      if (err) setError(mapSupabaseError(err.message))
    } catch {
      setError(mapSupabaseError('Network request failed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <SiteLayout>
      <div className={s.wrapper}>
        <div className={s.card}>
          <div className={s.title}>Connexion</div>
          {error && <div className={s.error}>{error}</div>}
          {magicSent ? (
            <div className="text-base font-bold mb-6 text-center text-text-muted">
              Un lien magique t'a été envoyé par email.
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">Email *</FieldLabel>
                    <input
                      {...field}
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="exemple@mail.com"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? errorId : undefined}
                      className={s.input}
                      style={{ borderColor: fieldState.invalid ? 'var(--color-error)' : undefined }}
                    />
                    {fieldState.invalid && <div id={errorId}><FieldError errors={[fieldState.error]} /></div>}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-password">Mot de passe *</FieldLabel>
                    <input
                      {...field}
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? pwErrorId : undefined}
                      className={s.input}
                      style={{ borderColor: fieldState.invalid ? 'var(--color-error)' : undefined }}
                    />
                    {fieldState.invalid && <div id={pwErrorId}><FieldError errors={[fieldState.error]} /></div>}
                  </Field>
                )}
              />
              <button type="submit" disabled={loading} className={`${s.btn} ${s.primaryBtn}`} style={{ opacity: loading ? 0.6 : 1 }}>{loading ? 'Connexion…' : 'Se connecter'}</button>
              <div className={s.divider}>
                <div className={s.line} /><span>ou</span><div className={s.line} />
              </div>
              <button type="button" disabled={loading} className={`${s.btn} ${s.secondaryBtn}`} style={{ opacity: loading ? 0.6 : 1 }} onClick={handleMagicLink}>Envoyer un lien magique</button>
              <button type="button" disabled={loading} className={`${s.btn} ${s.secondaryBtn}`} style={{ opacity: loading ? 0.6 : 1 }} onClick={handleGoogle}>Continuer avec Google</button>
              <button type="button" disabled={loading} className={`${s.btn} ${s.secondaryBtn}`} style={{ opacity: loading ? 0.6 : 1 }} onClick={handleMicrosoft}>Continuer avec Microsoft</button>
            </form>
          )}
          <button className={`${s.link} bg-none border-none`} onClick={() => navigate({ to: '/register' })}>Pas encore de compte ? S'inscrire</button>
        </div>
      </div>
    </SiteLayout>
  )
}
