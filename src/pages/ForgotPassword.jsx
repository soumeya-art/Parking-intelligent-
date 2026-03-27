import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import Logo from '../components/Logo'
import { auth } from '../lib/api'
import './Auth.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resetLink, setResetLink] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await auth.forgotPassword(email)
      setSent(true)
      if (res.resetLink) setResetLink(res.resetLink)
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <Logo size={56} />
            <h1>Email envoyé</h1>
            <p>Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.</p>
          </div>
          {resetLink && (
            <div className="auth-dev-link">
              <p><strong>Mode test</strong> — Copiez ce lien :</p>
              <a href={resetLink} className="auth-reset-link">{resetLink}</a>
            </div>
          )}
          <p className="auth-switch">
            <Link to="/connexion"><ArrowLeft size={16} /> Retour à la connexion</Link>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Logo size={56} />
          <h1>Mot de passe oublié</h1>
          <p>Entrez votre email pour recevoir un lien de réinitialisation</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="input-group">
            <Mail size={20} />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Envoi...' : 'Envoyer le lien'}
          </button>
          <p className="auth-switch">
            <Link to="/connexion"><ArrowLeft size={16} /> Retour à la connexion</Link>
            {' · '}
            <Link to="/">Accueil</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
