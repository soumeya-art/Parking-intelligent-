import { useState, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LogIn, Mail, Lock, Car } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import './Auth.css'

export default function Login() {
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const location = useLocation()
  const [role, setRole] = useState(location.state?.role === 'admin' ? 'admin' : 'conducteur')
  useEffect(() => {
    if (location.state?.role === 'admin') setRole('admin')
    else if (location.state?.role === 'conducteur') setRole('conducteur')
  }, [location.state?.role])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, motDePasse, role)
      const from = location.state?.from?.pathname
      navigate(role === 'admin' ? '/admin' : (from === '/reservation' ? '/reservation' : '/dashboard'))
    } catch (err) {
      setError(err.message || 'Erreur de connexion')
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
            Pour réserver une place, connectez-vous ci-dessous ou <Link to="/inscription" state={{ from: { pathname: '/reservation' } }}>inscrivez-vous</Link>.
          </div>
        )}
        <div className="auth-header">
          <Logo size={56} />
          <h1>MOUBARIK Parking</h1>
          <p>Djibouti — Connexion</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="role-tabs">
            <button type="button" className={role === 'conducteur' ? 'active' : ''} onClick={() => setRole('conducteur')}>
              <Car size={18} /> Conducteur
            </button>
            <button type="button" className={role === 'admin' ? 'active' : ''} onClick={() => setRole('admin')}>
              <LogIn size={18} /> Admin
            </button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          <div className="input-group">
            <Mail size={20} />
            <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input-group">
            <Lock size={20} />
            <input type="password" placeholder="Mot de passe" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} required />
          </div>

          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="auth-switch">
            <Link to="/mot-de-passe-oublie" className="auth-forgot-link">Mot de passe oublié ?</Link>
          </p>
          <p className="auth-switch">
            {role === 'conducteur' ? (
              <>Pas encore de compte ? <Link to="/inscription">S'inscrire</Link>{' · '}</>
            ) : (
              <span className="auth-admin-note">Les administrateurs ne s&apos;inscrivent pas.</span>
            )}
            <Link to="/reservation">Réserver (connexion requise)</Link>
            {' · '}
            <Link to="/">Accueil</Link>
          </p>
        </form>
      </div>
    </div>
  )
}
