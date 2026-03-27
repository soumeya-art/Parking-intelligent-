import { useState } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { UserPlus, Mail, Lock, User, Phone } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import './Auth.css'

export default function Register() {
  const [nomPrenom, setNomPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [telephone, setTelephone] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [confirmMotDePasse, setConfirmMotDePasse] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

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
      const parts = nomPrenom.trim().split(/\s+/)
      const nom = parts[0] || ''
      const prenom = parts.slice(1).join(' ') || parts[0] || ''
      await register(nom, prenom, email, telephone || undefined, motDePasse)
      const fromReservation = location.state?.from?.pathname === '/reservation'
      navigate(fromReservation ? '/reservation' : '/dashboard')
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription")
    } finally {
      setLoading(false)
    }
  }

  const fromReservation = location.state?.from?.pathname === '/reservation'

  return (
    <div className="auth-page">
      <div className="auth-theme-toggle">
        <ThemeToggle />
      </div>
      <div className="auth-card">
        {fromReservation && (
          <div className="auth-reservation-msg">
            Pour réserver une place, <strong>inscrivez-vous</strong> ci-dessous ou <Link to="/connexion" state={{ from: { pathname: '/reservation' } }}>connectez-vous</Link>.
          </div>
        )}
        <div className="auth-header">
          <Logo size={56} />
          <h1>MOUBARIK Parking</h1>
          <p>Djibouti — Inscription conducteur</p>
          <p className="auth-register-hint">Réservé aux conducteurs. Les administrateurs ne s&apos;inscrivent pas.</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && <div className="auth-error">{error}</div>}

          <div className="input-group">
            <User size={20} />
            <input type="text" placeholder="Nom/Prénom" value={nomPrenom} onChange={(e) => setNomPrenom(e.target.value)} required />
          </div>
          <div className="input-group">
            <Mail size={20} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <Phone size={20} />
            <input type="tel" placeholder="Téléphone (optionnel)" value={telephone} onChange={(e) => setTelephone(e.target.value)} />
          </div>
          <div className="input-group">
            <Lock size={20} />
            <input type="password" placeholder="Mot de passe (min. 6 caractères)" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
          </div>
          <div className="input-group">
            <Lock size={20} />
            <input type="password" placeholder="Confirmer le mot de passe" value={confirmMotDePasse} onChange={(e) => setConfirmMotDePasse(e.target.value)} required />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Inscription...' : "S'inscrire"}
          </button>

          <p className="auth-switch">
            Déjà un compte ? <Link to="/connexion" state={location.state}>Se connecter</Link>
            {' · '}
            <Link to="/">Accueil</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
