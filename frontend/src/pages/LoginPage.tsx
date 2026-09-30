import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import SiteLayout from '../components/landing/SiteLayout'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { signInWithEmail, signInWithMagicLink, signInWithGoogle, signInWithMicrosoft } from '../services/auth'
import useAppStore from '../store/useAppStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldLabel, FieldError } from '../components/ui/field'
import { Loader2 } from 'lucide-react'
import { loginSchema, type LoginInput } from '../schemas/auth'
import { mapSupabaseError } from '../schemas/errors'

const s: Record<string, string> = {
  wrapper: 'flex items-center justify-center px-5 py-10',
  title: 'text-2xl font-bold mb-6 text-center text-text',
  divider: 'flex items-center gap-3 my-4 text-divider text-xs',
  line: 'flex-1 h-px bg-border',
  error: 'text-error text-xs mb-3 text-center',
  link: 'text-accent-light cursor-pointer text-center mt-3 text-sm',
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
  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form (bibliothèque de formulaires du repo) : watch() non mémoïsable, composant non mémoïsé.
  const email = form.watch('email')
  const onSubmit = async (data: LoginInput) => {
    setError('')
    setLoading(true)
    try {
      const { data: authData, error: err } = await signInWithEmail(data.email, data.password)
      if (err) setError(mapSupabaseError(err.message))
      else {
        useAppStore.getState().setUser(authData?.user ?? null)
        navigate({ to: '/projets' })
      }
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
      <div className={s.wrapper} style={{ minHeight: '60vh' }}>
        <Card className="w-full bg-card border-border shadow-md" style={{ maxWidth: 400 }}>
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-2xl font-bold text-center text-foreground">Connexion</CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-2">
            {error && <div className={s.error}>{error}</div>}
            {magicSent ? (
              <div className="text-base font-bold mb-6 text-center text-muted-foreground">
                Un lien magique t&apos;a été envoyé par email.
              </div>
            ) : (
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
                <div className="flex flex-col gap-4">
                <Controller
                  name="email"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field dataInvalid={fieldState.invalid}>
                      <FieldLabel htmlFor="email">Email *</FieldLabel>
                      <Input
                        id="email"
                        type="email"
                        placeholder="exemple@mail.com"
                        value={field.value}
                        onChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="password"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field dataInvalid={fieldState.invalid}>
                      <FieldLabel htmlFor="password">Mot de passe *</FieldLabel>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••"
                        value={field.value}
                        onChange={field.onChange}
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading && <Loader2 className="animate-spin size-4 mr-2" />}
                  {loading ? 'Connexion…' : 'Se connecter'}
                </Button>
                </div>
                <div className={s.divider}>
                  <div className={s.line} /><span>ou</span><div className={s.line} />
                </div>
                <div className="flex flex-col gap-2">
                  <Button type="button" variant="secondary" className="w-full" disabled={loading} onClick={handleMagicLink}>
                    {loading && <Loader2 className="animate-spin size-4 mr-2" />}
                    Envoyer un lien magique
                  </Button>
                  <Button type="button" variant="secondary" className="w-full" disabled={loading} onClick={handleGoogle}>
                    {loading && <Loader2 className="animate-spin size-4 mr-2" />}
                    Continuer avec Google
                  </Button>
                  <Button type="button" variant="secondary" className="w-full" disabled={loading} onClick={handleMicrosoft}>
                    {loading && <Loader2 className="animate-spin size-4 mr-2" />}
                    Continuer avec Microsoft
                  </Button>
                </div>
              </form>
            )}
            <button className={`${s.link} bg-transparent border-none w-full`} onClick={() => navigate({ to: '/register' })}>Pas encore de compte ? S&apos;inscrire</button>
          </CardContent>
        </Card>
      </div>
    </SiteLayout>
  )
}
