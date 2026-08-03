import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUp } from '../services/auth'
import SiteLayout from '../components/landing/SiteLayout'
import { theme } from '../theme'
import { registerSchema, type RegisterInput } from '../schemas/auth'
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
  error: { color: theme.color.error, fontSize: 13, marginBottom: 12, textAlign: 'center' },
  link: { color: theme.color.auth, cursor: 'pointer', textAlign: 'center', marginTop: 12, fontSize: 14 },
}

const ruleStyle = (ok: boolean): React.CSSProperties => ({
  color: ok ? theme.color.success : theme.color.textDim,
  fontSize: 12,
  fontWeight: 700,
  marginBottom: 4,
})

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '', confirm: '' },
  })
  const password = form.watch('password')

  const rules = [
    { label: 'Au moins 6 caractères', ok: password.length >= 6 },
    { label: 'Une majuscule', ok: /[A-Z]/.test(password) },
    { label: 'Une minuscule', ok: /[a-z]/.test(password) },
    { label: 'Un chiffre', ok: /[0-9]/.test(password) },
  ]

  const onSubmit = async (data: RegisterInput) => {
    setError('')
    setLoading(true)
    try {
      const { data: res, error: err } = await signUp(data.email, data.password)
      if (err) setError(mapSupabaseError(err.message))
      else if (!res.user) setError('Un compte existe déjà avec cet email')
      else setDone(true)
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
          <div style={s.title}>Inscription</div>
          {error && <div style={s.error}>{error}</div>}
          {done ? (
            <div style={{ ...s.title, fontSize: 16, color: theme.color.textMuted }}>
              Compte créé ! Vérifie tes emails pour confirmer.
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <label style={s.label} htmlFor="register-email">Email</label>
              <input id="register-email" style={s.input} type="email" placeholder="exemple@mail.com" aria-invalid={!!form.formState.errors.email} {...form.register('email')} />
              {form.formState.errors.email && <div style={s.fieldError} role="alert">{form.formState.errors.email.message}</div>}
              <label style={s.label} htmlFor="register-password">Mot de passe</label>
              <input id="register-password" style={s.input} type="password" placeholder="••••••" aria-invalid={!!form.formState.errors.password} {...form.register('password')} />
              {form.formState.errors.password && <div style={s.fieldError} role="alert">{form.formState.errors.password.message}</div>}
              <div style={{ marginTop: -8, marginBottom: 12 }}>
                {rules.map(r => (
                  <div key={r.label} style={ruleStyle(r.ok)}>{r.ok ? '✓' : '○'} {r.label}</div>
                ))}
              </div>
              <label style={s.label} htmlFor="register-confirm">Confirmer le mot de passe</label>
              <input id="register-confirm" style={s.input} type="password" placeholder="••••••" aria-invalid={!!form.formState.errors.confirm} {...form.register('confirm')} />
              {form.formState.errors.confirm && <div style={s.fieldError} role="alert">{form.formState.errors.confirm.message}</div>}
              <button type="submit" disabled={loading} style={{ ...s.btn, ...s.primaryBtn, opacity: loading ? 0.6 : 1 }}>{loading ? 'Création…' : 'Créer un compte'}</button>
            </form>
          )}
          <button style={{ ...s.link, background: 'none', border: 'none' }} onClick={() => navigate('/login')}>Déjà un compte ? Se connecter</button>
        </div>
      </div>
    </SiteLayout>
  )
}
