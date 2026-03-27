import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { Lock, CheckCircle } from 'lucide-react'
import Logo from '../components/Logo'
import { auth } from '../lib/api'
import './Auth.css'

export default function ResetPassword() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (motDePasse !== confirmMotDePasse) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (motDePasse.length < 6) {
      setError('Le mot de passe doit faire au moins 6 caractères')
      return
    }
    setLoading(true)
    try {
      await auth.resetPassword(token, motDePasse)
      setSuccess(true)
      setTimeout(() => navigate('/connexion'), 3000)
    } catch (err) {
      setError(err.message || 'Lien expiré ou invalide')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <Logo size={56} />
            <div className="auth-success-icon"><CheckCircle size={48} /></div>
            <h1>Mot de passe mis à jour</h1>
            <p>Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.</p>
          </div>
          <p className="auth-switch">
            <Link to="/connexion">Se connecter</Link>
          </p>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-header">
            <h1>Lien invalide</h1>
            <p>Ce lien de réinitialisation est invalide ou a expiré.</p>
          </div>
          <p className="auth-switch">
            <Link to="/mot-de-passe-oublie">Demander un nouveau lien</Link>
            {' · '}
            <Link to="/connexion">Connexion</Link>
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
          <h1>Nouveau mot de passe</h1>
          <p>Choisissez un mot de passe d'au moins 6 caractères</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}
          <div className="input-group">
            <Lock size={20} />
            <input
              type="password"
              placeholder="Nouveau mot de passe"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="input-group">
            <Lock size={20} />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmMotDePasse}
              onChange={(e) => setConfirmMotDePasse(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Enregistrement...' : 'Réinitialiser le mot de passe'}
          </button>
          <p className="auth-switch">
            <Link to="/connexion">Retour à la connexion</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
