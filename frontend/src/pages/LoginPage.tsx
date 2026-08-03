import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmail, signInWithMagicLink, signInWithGoogle } from '../services/auth'
import SiteLayout from '../components/landing/SiteLayout'
import { theme } from '../theme'
import { loginSchema, type LoginInput } from '../schemas/auth'
import { mapSupabaseError } from '../schemas/errors'

const s: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '40px 20px' },
  card: { background: theme.color.surface4, borderRadius: theme.radius.md, padding: 40, width: '100%', maxWidth: 400 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: theme.color.text },
  label: { display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 700, color: theme.color.textMuted },
  input: { width: '100%', padding: '10px 14px', marginBottom: 16, borderRadius: 8, border: `1px solid ${theme.color.border}`, background: '#2a2724', color: theme.color.text, fontSize: 14 },
  fieldError: { color: theme.color.error, fontSize: 12, marginTop: -12, marginBottom: 12 },
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
              <label style={s.label} htmlFor="login-email">Email</label>
              <input id="login-email" style={s.input} type="email" placeholder="exemple@mail.com" aria-invalid={!!form.formState.errors.email} {...form.register('email')} />
              {form.formState.errors.email && <div style={s.fieldError} role="alert">{form.formState.errors.email.message}</div>}
              <label style={s.label} htmlFor="login-password">Mot de passe</label>
              <input id="login-password" style={s.input} type="password" placeholder="••••••" aria-invalid={!!form.formState.errors.password} {...form.register('password')} />
              {form.formState.errors.password && <div style={s.fieldError} role="alert">{form.formState.errors.password.message}</div>}
              <button type="submit" disabled={loading} style={{ ...s.btn, ...s.primaryBtn, opacity: loading ? 0.6 : 1 }}>{loading ? 'Connexion…' : 'Se connecter'}</button>
              <div style={s.divider}>
                <div style={s.line} /><span>ou</span><div style={s.line} />
              </div>
              <button type="button" disabled={loading} style={{ ...s.btn, ...s.secondaryBtn, opacity: loading ? 0.6 : 1 }} onClick={handleMagicLink}>Envoyer un lien magique</button>
              <button type="button" disabled={loading} style={{ ...s.btn, ...s.secondaryBtn, opacity: loading ? 0.6 : 1 }} onClick={handleGoogle}>Continuer avec Google</button>
            </form>
          )}
          <button style={{ ...s.link, background: 'none', border: 'none' }} onClick={() => navigate('/register')}>Pas encore de compte ? S'inscrire</button>
        </div>
      </div>
    </SiteLayout>
  )
}
