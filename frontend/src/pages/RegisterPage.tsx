import { useState } from 'react'
import useAppStore from '../store/useAppStore'
import { signUp } from '../services/auth'
import SiteLayout from '../components/landing/SiteLayout'

const s: Record<string, React.CSSProperties> = {
  wrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', padding: '40px 20px' },
  card: { background: '#1e1c19', borderRadius: 12, padding: 40, width: '100%', maxWidth: 400 },
  title: { fontSize: 24, fontWeight: 700, marginBottom: 24, textAlign: 'center', color: '#f0e9e3' },
  input: { width: '100%', padding: '10px 14px', marginBottom: 16, borderRadius: 8, border: '1px solid #3a3531', background: '#2a2724', color: '#f0e9e3', fontSize: 14, outline: 'none' },
  btn: { width: '100%', padding: '10px 14px', borderRadius: 8, border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 12 },
  primaryBtn: { background: '#6366F1', color: '#fff' },
  error: { color: '#ef4444', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  success: { color: '#22c55e', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  link: { color: '#6366F1', cursor: 'pointer', textAlign: 'center', marginTop: 12, fontSize: 14 },
}

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const goLogin = useAppStore(s => s.goLogin)

  const handleRegister = async () => {
    setError('')
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    if (password.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères.')
      return
    }
    const { error: err } = await signUp(email, password)
    if (err) setError(err.message)
    else setDone(true)
  }

  return (
    <SiteLayout>
      <div style={s.wrapper}>
        <div style={s.card}>
          <div style={s.title}>Inscription</div>
          {error && <div style={s.error}>{error}</div>}
          {done ? (
            <div style={{ ...s.title, fontSize: 16, color: '#6b6560' }}>
              Compte créé ! Vérifie tes emails pour confirmer.
            </div>
          ) : (
            <>
              <input style={s.input} placeholder="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
              <input style={s.input} placeholder="Mot de passe" type="password" value={password} onChange={e => setPassword(e.target.value)} />
              <input style={s.input} placeholder="Confirmer le mot de passe" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} />
              <button style={{ ...s.btn, ...s.primaryBtn }} onClick={handleRegister}>Créer un compte</button>
            </>
          )}
          <div style={s.link} onClick={goLogin}>Déjà un compte ? Se connecter</div>
        </div>
      </div>
    </SiteLayout>
  )
}
