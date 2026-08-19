import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUp } from '../services/auth'
import SiteLayout from '../components/landing/SiteLayout'
import { Field, FieldError, FieldLabel } from '../components/ui/field'
import { CheckCircle2, Circle } from 'lucide-react'
import { registerSchema, type RegisterInput } from '../schemas/auth'
import { mapSupabaseError } from '../schemas/errors'

const s: Record<string, string> = {
  wrapper: 'flex items-center justify-center min-h-[60vh] px-5 py-10',
  card: 'bg-surface4 rounded-md p-10 w-full max-w-[400px]',
  title: 'text-2xl font-bold mb-6 text-center text-text',
  input: 'w-full px-3.5 py-2.5 mb-4 rounded-[8px] border border-border bg-input-bg text-text text-sm',
  btn: 'w-full px-3.5 py-2.5 rounded-[8px] border-none text-sm font-semibold cursor-pointer mb-3',
  primaryBtn: 'bg-auth text-white',
  error: 'text-error text-[13px] mb-3 text-center',
  link: 'text-[#E8915F] cursor-pointer text-center mt-3 text-sm',
}

const ruleStyle = (ok: boolean): string =>
  `${ok ? 'text-success' : 'text-text-dim'} text-xs font-bold mb-1`

const regEmailErrorId = 'register-email-error'
const regPwErrorId = 'register-password-error'
const regConfirmErrorId = 'register-confirm-error'

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
  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form (bibliothèque de formulaires du repo) : watch() non mémoïsable, composant non mémoïsé.
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
      <div className={s.wrapper}>
        <div className={s.card}>
          <div className={s.title}>Inscription</div>
          {error && <div className={s.error}>{error}</div>}
          {done ? (
            <div className="text-base font-bold mb-6 text-center text-text-muted">
              Compte créé ! Vérifie tes emails pour confirmer.
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-email">Email *</FieldLabel>
                    <input
                      {...field}
                      id="register-email"
                      type="email"
                      autoComplete="email"
                      placeholder="exemple@mail.com"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? regEmailErrorId : undefined}
                      className={s.input}
                      style={{ borderColor: fieldState.invalid ? 'var(--color-error)' : undefined }}
                    />
                    {fieldState.invalid && <div id={regEmailErrorId}><FieldError errors={[fieldState.error]} /></div>}
                  </Field>
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-password">Mot de passe *</FieldLabel>
                    <input
                      {...field}
                      id="register-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? regPwErrorId : undefined}
                      className={s.input}
                      style={{ borderColor: fieldState.invalid ? 'var(--color-error)' : undefined }}
                    />
                    {fieldState.invalid && <div id={regPwErrorId}><FieldError errors={[fieldState.error]} /></div>}
                  </Field>
                )}
              />
              <div className="-mt-2 mb-3">
                {rules.map(r => (
                  <div key={r.label} className={ruleStyle(r.ok)}>{r.ok ? <CheckCircle2 size={14} /> : <Circle size={14} />} {r.label}</div>
                ))}
              </div>
              <Controller
                name="confirm"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="register-confirm">Confirmer le mot de passe *</FieldLabel>
                    <input
                      {...field}
                      id="register-confirm"
                      type="password"
                      autoComplete="new-password"
                      placeholder="••••••"
                      aria-invalid={fieldState.invalid}
                      aria-describedby={fieldState.invalid ? regConfirmErrorId : undefined}
                      className={s.input}
                      style={{ borderColor: fieldState.invalid ? 'var(--color-error)' : undefined }}
                    />
                    {fieldState.invalid && <div id={regConfirmErrorId}><FieldError errors={[fieldState.error]} /></div>}
                  </Field>
                )}
              />
              <button type="submit" disabled={loading} className={`${s.btn} ${s.primaryBtn}`} style={{ opacity: loading ? 0.6 : 1 }}>{loading ? 'Création…' : 'Créer un compte'}</button>
            </form>
          )}
          <button className={`${s.link} bg-none border-none`} onClick={() => navigate('/login')}>Déjà un compte ? Se connecter</button>
        </div>
      </div>
    </SiteLayout>
  )
}
