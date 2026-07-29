import { useState } from 'react'
import useAppStore from '../store/useAppStore'
import { signInWithEmail, signInWithMagicLink, signInWithGoogle } from '../services/auth'
import SiteLayout from '../components/landing/SiteLayout'

const s: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '40px 20px' },
  card: { background: '#1e1c19', borderRadius: 12, padding: 40, width: '100%', maxWidth: 400 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: '#f0e9e3' },
  input: { width: '100%', padding: '10px 14px', marginBottom: 16, borderRadius: 8, border: '1px solid #3a3531', background: '#2a2724', color: '#f0e9e3', fontSize: 14, outline: 'none' },
  btn: { width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12 },
  primaryBtn: { background: '#6366F1', color: '#fff' },
  secondaryBtn: { background: '#3a3531', color: '#f0e9e3' },
  divider: { display: 'flex', alignItems: 'center', gap: 12, margin: '16px 0', color: '#6b6560', fontSize: 13 },
  line: { flex: 1, height: 1, background: '#3a3531' },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  link: { color: '#6366F1', cursor: 'pointer', textAlign: 'center', marginTop: 12, fontSize: 14 },
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [magicSent, setMagicSent] = useState(false)
  const goBuild = useAppStore(s => s.goBuild)
  const goRegister = useAppStore(s => s.goRegister)

  const handleEmailLogin = async () => {
    setError('')
    const { error: err } = await signInWithEmail(email, password)
    if (err) setError(err.message)
    else goBuild()
  }

  const handleMagicLink = async () => {
    setError('')
    const { error: err } = await signInWithMagicLink(email)
    if (err) setError(err.message)
    else setMagicSent(true)
  }

  const handleGoogle = async () => {
    setError('')
    const { error: err } = await signInWithGoogle()
    if (err) setError(err.message)
  }

  return (
    <SiteLayout>
      <div style={s.wrapper}>
        <div style={s.card}>
          <div style={s.title}>Connexion</div>
          {error && <div style={s.error}>{error}</div>}
          {magicSent ? (
            <div style={{ ...s.title, fontSize: 16, color: '#6b6560' }}>
              Un lien magique t'a été envoyé par email.
            </div>
          ) : (
            <>
              <input style={s.input} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <input style={s.input} placeholder="Mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <button style={{ ...s.btn, ...s.primaryBtn }} onClick={handleEmailLogin}>Se connecter</button>
              <div style={s.divider}>
                <div style={s.line} /><span>ou</span><div style={s.line} />
              </div>
              <button style={{ ...s.btn, ...s.secondaryBtn }} onClick={handleMagicLink}>Envoyer un lien magique</button>
              <button style={{ ...s.btn, ...s.secondaryBtn }} onClick={handleGoogle}>Continuer avec Google</button>
            </>
          )}
          <div style={s.link} onClick={goRegister}>Pas encore de compte ? S'inscrire</div>
        </div>
      </div>
    </SiteLayout>
  )
}
