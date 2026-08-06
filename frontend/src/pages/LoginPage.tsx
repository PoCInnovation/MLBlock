import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmail, signInWithMagicLink, signInWithGoogle, signInWithMicrosoft } from '../services/auth'
import SiteLayout from '../components/landing/SiteLayout'
import { Field, FieldError, FieldLabel } from '../components/ui/field'
import { theme } from '../theme'
import { loginSchema, type LoginInput } from '../schemas/auth'
import { mapSupabaseError } from '../schemas/errors'

const s: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '40px 20px' },
  card: { background: theme.color.surface4, borderRadius: theme.radius.md, padding: 40, width: '100%', maxWidth: 400 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: theme.color.text },
  input: { width: '100%', padding: '10px 14px', marginBottom: 16, borderRadius: 8, border: `1px solid ${theme.color.border}`, background: '#2a2724', color: theme.color.text, fontSize: 14 },
  btn: { width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12 },
  primaryBtn: { background: theme.color.auth, color: '#fff' },
  secondaryBtn: { background: theme.color.border, color: theme.color.text },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: theme.color.divider, fontSize: 13 },
  line: { flex: 1, height: 1, background: theme.color.border },
  error: { color: theme.color.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  link: { color: theme.color.auth, cursor: 'pointer', textAlign: 'center', marginTop: 12, fontSize: 14 },
}

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
  const email = form.watch('email')

  const onSubmit = async (data: LoginInput) => {
    setError('')
    setLoading(true)
    try {
      const { error: err } = await signInWithEmail(data.email, data.password)
      if (err) setError(mapSupabaseError(err.message))
      else navigate('/editor')
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
      <div style={s.wrapper}>
        <div style={s.card}>
          <div style={s.title}>Connexion</div>
          {error && <div style={s.error}>{error}</div>}
          {magicSent ? (
            <div style={{ ...s.title, fontSize: 16, color: theme.color.textMuted }}>
              Un lien magique t'a été envoyé par email.
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-email">Email</FieldLabel>
                    <input
                      {...field}
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder="exemple@mail.com"
                      aria-invalid={fieldState.invalid}
                      style={{ ...s.input, borderColor: fieldState.invalid ? theme.color.error : undefined }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="login-password">Mot de passe</FieldLabel>
                    <input
                      {...field}
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder="••••••"
                      aria-invalid={fieldState.invalid}
                      style={{ ...s.input, borderColor: fieldState.invalid ? theme.color.error : undefined }}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <button type="submit" disabled={loading} style={{ ...s.btn, ...s.primaryBtn, opacity: loading ? 0.6 : 1 }}>{loading ? 'Connexion…' : 'Se connecter'}</button>
              <div style={s.divider}>
                <div style={s.line} /><span>ou</span><div style={s.line} />
              </div>
              <button type="button" disabled={loading} style={{ ...s.btn, ...s.secondaryBtn, opacity: loading ? 0.6 : 1 }} onClick={handleMagicLink}>Envoyer un lien magique</button>
              <button type="button" disabled={loading} style={{ ...s.btn, ...s.secondaryBtn, opacity: loading ? 0.6 : 1 }} onClick={handleGoogle}>Continuer avec Google</button>
              <button type="button" disabled={loading} style={{ ...s.btn, ...s.secondaryBtn, opacity: loading ? 0.6 : 1 }} onClick={handleMicrosoft}>Continuer avec Microsoft</button>
            </form>
          )}
          <button style={{ ...s.link, background: 'none', border: 'none' }} onClick={() => navigate('/register')}>Pas encore de compte ? S'inscrire</button>
        </div>
      </div>
    </SiteLayout>
  )
}
