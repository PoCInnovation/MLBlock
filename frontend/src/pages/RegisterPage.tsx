import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signUp } from '../services/auth'
import SiteLayout from '../components/landing/SiteLayout'
import { FormLayout } from '../components/ui/field'
import { CheckCircle2, Circle } from 'lucide-react'
import { Card, Button, TextInput } from '@astryxdesign/core'
import { registerSchema, type RegisterInput } from '../schemas/auth'
import { mapSupabaseError } from '../schemas/errors'

const s: Record<string, string> = {
  wrapper: 'flex items-center justify-center min-h-[60vh] px-5 py-10',
  title: 'text-2xl font-bold mb-6 text-center text-text',
  error: 'text-error text-[13px] mb-3 text-center',
  link: 'text-[#E8915F] cursor-pointer text-center mt-3 text-sm',
}

const ruleStyle = (ok: boolean): string =>
  `${ok ? 'text-success' : 'text-text-dim'} text-xs font-bold mb-1`

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
        <Card style={{ padding: 40, width: '100%', maxWidth: 400 }}>
          <div className={s.title}>Inscription</div>
          {error && <div className={s.error}>{error}</div>}
          {done ? (
            <div className="text-base font-bold mb-6 text-center text-text-muted">
              Compte créé ! Vérifie tes emails pour confirmer.
            </div>
          ) : (
            <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
              <FormLayout>
              <Controller
                name="email"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextInput
                    label="Email *"
                    type="email"
                    placeholder="exemple@mail.com"
                    value={field.value}
                    onChange={v => field.onChange(v)}
                    status={fieldState.invalid ? { type: 'error', message: fieldState.error?.message } : undefined}
                  />
                )}
              />
              <Controller
                name="password"
                control={form.control}
                render={({ field, fieldState }) => (
                  <TextInput
                    label="Mot de passe *"
                    type="password"
                    placeholder="••••••"
                    value={field.value}
                    onChange={v => field.onChange(v)}
                    status={fieldState.invalid ? { type: 'error', message: fieldState.error?.message } : undefined}
                  />
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
                  <TextInput
                    label="Confirmer le mot de passe *"
                    type="password"
                    placeholder="••••••"
                    value={field.value}
                    onChange={v => field.onChange(v)}
                    status={fieldState.invalid ? { type: 'error', message: fieldState.error?.message } : undefined}
                  />
                )}
              />
              <Button label={loading ? 'Création…' : 'Créer un compte'} variant="primary" type="submit" isLoading={loading} width="100%" />
              </FormLayout>
            </form>
          )}
          <button className={`${s.link} bg-none border-none`} onClick={() => navigate({ to: '/login' })}>Déjà un compte ? Se connecter</button>
        </Card>
      </div>
    </SiteLayout>
  )
}
