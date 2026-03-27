import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Car, CreditCard, Clock, ChevronRight, Sparkles, LogIn, UserPlus, LogOut } from 'lucide-react'
import Logo from '../components/Logo'
import ThemeToggle from '../components/ThemeToggle'
import BackToTop from '../components/BackToTop'
import { useAuth } from '../context/AuthContext'
import './Accueil.css'

// Vraies photos de Djibouti-Ville (Wikimedia Commons + Unsplash)
const DJIBOUTI_IMAGES = [
  'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Place_Menelik_in_Djibouti_city_%2825058480721%29.jpg/1920px-Place_Menelik_in_Djibouti_city_%2825058480721%29.jpg',
  'https://upload.wikimedia.org/wikipedia/commons/7/7f/Djibouti_Port.JPG',
  'https://upload.wikimedia.org/wikipedia/commons/6/6f/Djibouti_Ville.jpg',
  'https://images.unsplash.com/photo-1639202170325-6782215f596b?w=1200',
  'https://images.unsplash.com/photo-1655153985330-f346ba3a316a?w=1200',
]

export default function Accueil() {
  const { user, logout } = useAuth()
  const [showReserveModal, setShowReserveModal] = useState(false)
  const navigate = useNavigate()

  const handleReserveClick = (e) => {
    if (e) e.preventDefault()
    if (!user) setShowReserveModal(true)
  }

  useEffect(() => {
    const onEscape = (e) => { if (e.key === 'Escape') setShowReserveModal(false) }
    if (showReserveModal) {
      document.addEventListener('keydown', onEscape)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', onEscape)
      document.body.style.overflow = ''
    }
  }, [showReserveModal])

  return (
    <div className="accueil">
      <header className="accueil-header">
        <div className="accueil-header-inner">
          <Link to="/" className="accueil-logo">
            <Logo size={48} />
            <div>
              <span className="accueil-logo-text">MOUBARIK</span>
              <span className="accueil-logo-sub">Parking Djibouti</span>
            </div>
          </Link>
          <nav className="accueil-nav">
            <ThemeToggle />
            <Link to="/connexion" state={{ role: 'conducteur' }} className="accueil-nav-link">Se connecter</Link>
            <Link to="/inscription" className="accueil-nav-btn">S&apos;inscrire</Link>
            {user && (
              <button type="button" className="accueil-nav-link accueil-logout-btn" onClick={() => { logout(); navigate('/') }}>
                <LogOut size={18} /> Déconnexion
              </button>
            )}
          </nav>
        </div>
      </header>

      <section className="accueil-hero">
        <div className="accueil-hero-bg">
          <img src={DJIBOUTI_IMAGES[0]} alt="Place Menelik, Djibouti-Ville" />
          <div className="accueil-hero-overlay" />
        </div>
        <div className="accueil-hero-content">
          <span className="accueil-badge"><Sparkles size={16} /> Parking intelligent à Djibouti</span>
          <h1>
            Réservez votre place
            <span className="accueil-hero-highlight"> en un clic</span>
          </h1>
          <p className="accueil-hero-desc">
            MOUBARIK Parking — La solution de stationnement moderne à Djibouti-Ville.
            Connectez-vous pour réserver votre place. Paiement D-Money ou espèces FDJ.
          </p>
          <div className="accueil-hero-actions">
            {user ? (
              <Link to="/reservation" className="accueil-cta primary">
                Réserver une place <ChevronRight size={20} />
              </Link>
            ) : (
              <>
                <button type="button" className="accueil-cta primary" onClick={handleReserveClick}>
                  Réserver une place <ChevronRight size={20} />
                </button>
                <Link to="/connexion" state={{ role: 'conducteur' }} className="accueil-cta secondary">
                  <LogIn size={18} /> Connexion conducteur
                </Link>
                <Link to="/connexion" state={{ role: 'admin' }} className="accueil-cta secondary">
                  <LogIn size={18} /> Connexion admin
                </Link>
                <Link to="/inscription" className="accueil-cta secondary">
                  <UserPlus size={18} /> S&apos;inscrire
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      <section className="accueil-gallery">
        <h2>Djibouti-Ville</h2>
        <p className="accueil-gallery-desc">Place Menelik, le port, et les paysages de la capitale</p>
        <div className="accueil-gallery-grid">
          {DJIBOUTI_IMAGES.map((src, i) => (
            <div key={i} className={`accueil-gallery-item ${i === 0 ? 'span-2' : ''}`}>
              <img src={src} alt={i === 0 ? 'Place Menelik, Djibouti-Ville' : `Djibouti ${i + 1}`} loading="lazy" />
            </div>
          ))}
        </div>
      </section>

      <section className="accueil-features">
        <h2>Pourquoi MOUBARIK ?</h2>
        <div className="accueil-features-grid">
          <div className="accueil-feature">
            <div className="accueil-feature-icon"><MapPin size={32} /></div>
            <h3>Localisation GPS</h3>
            <p>Trouvez le parking MOUBARIK le plus proche de vous en un instant.</p>
          </div>
          <div className="accueil-feature">
            <div className="accueil-feature-icon"><Car size={32} /></div>
            <h3>Réservation simple</h3>
            <p>Choisissez votre place, date et heure. Votre place vous attend.</p>
          </div>
          <div className="accueil-feature">
            <div className="accueil-feature-icon"><CreditCard size={32} /></div>
            <h3>Paiement Djibouti</h3>
            <p>D-Money et espèces FDJ — les moyens de paiement utilisés à Djibouti.</p>
          </div>
          <div className="accueil-feature">
            <div className="accueil-feature-icon"><Clock size={32} /></div>
            <h3>Disponibilité en temps réel</h3>
            <p>Voyez les places libres en direct. Plus de mauvaise surprise.</p>
          </div>
        </div>
      </section>

      <section className="accueil-cta-section">
        <div className="accueil-cta-bg" style={{ backgroundImage: `url(${DJIBOUTI_IMAGES[1]})` }} />
        <div className="accueil-cta-overlay" />
        <div className="accueil-cta-content">
          <h2>Prêt à vous garer à Djibouti-Ville ?</h2>
          <p>Connectez-vous pour réserver votre place au parking MOUBARIK.</p>
          {user ? (
            <Link to="/reservation" className="accueil-cta primary large">
              Réserver maintenant <ChevronRight size={24} />
            </Link>
          ) : (
            <button type="button" className="accueil-cta primary large" onClick={() => setShowReserveModal(true)}>
              Réserver maintenant <ChevronRight size={24} />
            </button>
          )}
        </div>
      </section>

      <footer className="accueil-footer">
        <div className="accueil-footer-inner">
          <div className="accueil-footer-brand">
            <Logo size={36} />
            <span>MOUBARIK Parking • Djibouti</span>
          </div>
          <div className="accueil-footer-links">
            {user ? <Link to="/reservation">Réserver</Link> : <button type="button" className="accueil-footer-link-btn" onClick={() => setShowReserveModal(true)}>Réserver</button>}
            <Link to="/connexion" state={{ role: 'conducteur' }}>Se connecter</Link>
            <Link to="/inscription">S&apos;inscrire</Link>
          </div>
        </div>
        <p className="accueil-footer-copy">© 2025 MOUBARIK Parking — Djibouti</p>
      </footer>

      {showReserveModal && createPortal(
        <div
          className="accueil-modal-overlay"
          onClick={() => setShowReserveModal(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="accueil-modal-title"
        >
          <div className="accueil-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="accueil-modal-title">Pour réserver une place</h3>
            <p>Connectez-vous ou inscrivez-vous</p>
            <div className="accueil-modal-buttons">
              <button
                type="button"
                className="accueil-modal-btn connexion"
                onClick={() => {
                  setShowReserveModal(false)
                  navigate('/connexion', { state: { from: { pathname: '/reservation' }, role: 'conducteur' } })
                }}
              >
                <LogIn size={22} /> Se connecter (conducteur)
              </button>
              <button
                type="button"
                className="accueil-modal-btn inscription"
                onClick={() => {
                  setShowReserveModal(false)
                  navigate('/inscription', { state: { from: { pathname: '/reservation' } } })
                }}
              >
                <UserPlus size={22} /> S&apos;inscrire (conducteur)
              </button>
            </div>
            <button type="button" className="accueil-modal-close" onClick={() => setShowReserveModal(false)}>
              Fermer
            </button>
          </div>
        </div>,
        document.body
      )}
      <BackToTop />
    </div>
  )
}
