import { useState, useEffect } from 'react'
import { Car, MapPin, Clock, TrendingUp, LogOut, Smartphone, Banknote, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { getParkingStats, getFloors, getSessionActive, terminerSession, payerSession, getSystemesPaiement, signalerArrivee, getTarifsPublic } from '../lib/parkingService'
import ParkingProche from '../components/ParkingProche'
import './Dashboard.css'

function formatDuree(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

export default function Dashboard() {
  const [parkingStats, setParkingStats] = useState(null)
  const [floors, setFloors] = useState([])
  const [session, setSession] = useState(null)
  const [chrono, setChrono] = useState(0)
  const [showPayer, setShowPayer] = useState(false)
  const [montantAPayer, setMontantAPayer] = useState(0)
  const [idReservationPayer, setIdReservationPayer] = useState(null)
  const [selectedPaiement, setSelectedPaiement] = useState(1)
  const [paymentPhone, setPaymentPhone] = useState('')
  const [systemesPaiement, setSystemesPaiement] = useState([])
  const [loading, setLoading] = useState(false)
  const [payerOk, setPayerOk] = useState(false)
  const [payerEnAttenteAdmin, setPayerEnAttenteAdmin] = useState(false)

  const [pending, setPending] = useState(null)
  const [tarifPar30, setTarifPar30] = useState(250)
  const [tarifJournalier, setTarifJournalier] = useState(3000)

  const loadSession = () => {
    getSessionActive().then((r) => {
      setSession(r.active ? r : null)
      setPending(r.pending ? r : null)
      if (r.active && r.dateDebut) {
        const debut = new Date(r.dateDebut).getTime()
        setChrono(Math.floor((Date.now() - debut) / 1000))
      }
    })
  }

  useEffect(() => {
    getParkingStats().then(setParkingStats)
    getFloors().then(setFloors)
    getSystemesPaiement().then(setSystemesPaiement).catch(() => [])
    getTarifsPublic().then((t) => {
      const first = Array.isArray(t) ? t[0] : t
      if (first) {
        setTarifPar30(first.montantHoraire ?? 250)
        setTarifJournalier(first.montantJournalier ?? 3000)
      }
    }).catch(() => {})
    loadSession()
  }, [])

  useEffect(() => {
    if (!session?.active) return
    const iv = setInterval(() => setChrono((c) => c + 1), 1000)
    return () => clearInterval(iv)
  }, [session?.active])

  const handleSignalerArrivee = async () => {
    if (!pending?.idReservation) return
    setLoading(true)
    try {
      await signalerArrivee(pending.idReservation)
      setPending(null)
      loadSession()
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handleTerminer = async () => {
    if (!session?.idReservation) return
    setLoading(true)
    try {
      const r = await terminerSession(session.idReservation)
      setMontantAPayer(r.montant)
      setIdReservationPayer(r.idReservation)
      setShowPayer(true)
      setSession(null)
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const handlePayer = async () => {
    if (!idReservationPayer) return
    const isDMoney = selectedPaiement === 1
    if (isDMoney && paymentPhone.replace(/\D/g, '').length < 8) {
      alert('Numéro D-Money requis (8 chiffres)')
      return
    }
    setPayerEnAttenteAdmin(false)
    setLoading(true)
    try {
      const res = await payerSession(idReservationPayer, selectedPaiement, isDMoney ? paymentPhone : null)
      setPayerOk(true)
      setPayerEnAttenteAdmin(res?.enAttenteAdmin === true)
      if (isDMoney) window.open('https://payment.d-money.dj/', '_blank')
    } catch (e) {
      alert(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isDMoney = selectedPaiement === 1

  if (!parkingStats) return <div className="dashboard loading">Chargement...</div>

  if (payerOk) {
    return (
      <div className="dashboard">
        <div className={`session-payer-ok confirmation-visible ${payerEnAttenteAdmin ? 'payer-en-attente' : ''}`}>
          <div className="confirmation-icon-circle">
            <CheckCircle size={64} />
          </div>
          <h2>{payerEnAttenteAdmin ? 'Paiement en attente' : 'Paiement effectué'}</h2>
          <p>Montant : {montantAPayer} FDJ</p>
          {payerEnAttenteAdmin ? (
            <p className="payer-attente-msg">
              Votre paiement D-Money a été enregistré. L&apos;administrateur doit confirmer la réception. Vous recevrez une notification lorsque c&apos;est fait.
            </p>
          ) : (
            <p>Merci !</p>
          )}
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: '1.5rem' }}
            onClick={() => { setPayerOk(false); setShowPayer(false); setIdReservationPayer(null); }}
          >
            Retour au tableau de bord
          </button>
        </div>
      </div>
    )
  }

  if (showPayer && montantAPayer > 0) {
    return (
      <div className="dashboard">
        <div className="session-payer-card">
          <h2>À payer : {montantAPayer} FDJ</h2>
          <p>Choisissez le mode de paiement</p>
          <div className="payer-options">
            <button type="button" className={selectedPaiement === 1 ? 'active' : ''} onClick={() => setSelectedPaiement(1)}>
              <Smartphone size={20} /> D-Money
            </button>
            <button type="button" className={selectedPaiement === 2 ? 'active' : ''} onClick={() => setSelectedPaiement(2)}>
              <Banknote size={20} /> Espèces
            </button>
          </div>
          {isDMoney && (
            <>
              <input type="tel" placeholder="77 XX XX XX" value={paymentPhone} onChange={(e) => setPaymentPhone(e.target.value.replace(/\D/g, '').slice(0, 8))} className="payer-phone" />
              <p className="payer-dmoney-hint">Le paiement D-Money sera enregistré puis confirmé par l&apos;administrateur après réception.</p>
            </>
          )}
          <button className="btn-primary" onClick={handlePayer} disabled={loading || (isDMoney && paymentPhone.replace(/\D/g, '').length < 8)}>
            {loading ? 'Traitement...' : `Payer ${montantAPayer} FDJ`}
          </button>
        </div>
      </div>
    )
  }

  const occupancyRate = parkingStats.total > 0
    ? Math.round((parkingStats.occupied / parkingStats.total) * 100)
    : 0

  return (
    <div className="dashboard">
      <header className="page-header">
        <h1>Tableau de bord</h1>
        <p className="subtitle">MOUBARIK Parking - Djibouti • Vue d&apos;ensemble en temps réel</p>
      </header>

      {pending && (
        <div className="session-pending-card">
          <h3>Réservation en attente</h3>
          <p>Place <strong>{pending.spot}</strong></p>
          <p className="pending-hint">Vous avez 15 minutes pour arriver. Quand vous êtes sur place, cliquez ci-dessous pour démarrer le chrono (calcul des frais).</p>
          <button type="button" className="btn-primary" onClick={handleSignalerArrivee} disabled={loading}>
            {loading ? 'En cours...' : 'Signaler mon arrivée'}
          </button>
        </div>
      )}
      {session?.active && (
        <div className="session-active-card">
          <h3>Session en cours</h3>
          <p>Place {session.spot}</p>
          <div className="session-chrono">{formatDuree(chrono)}</div>
          <p className="session-montant-estime">
            Estimation : {Math.min(Math.ceil(chrono / 1800) * tarifPar30, tarifJournalier || Infinity)} FDJ
            <span className="session-tarif-hint"> ({tarifPar30} FDJ par 30 min)</span>
          </p>
          <button type="button" className="btn-primary session-terminer" onClick={handleTerminer} disabled={loading}>
            <LogOut size={18} /> {loading ? 'Calcul...' : 'Je pars'}
          </button>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card highlight">
          <div className="stat-icon available">
            <Car size={28} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{parkingStats.available}</span>
            <span className="stat-label">Places disponibles</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon occupied">
            <MapPin size={28} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{parkingStats.occupied}</span>
            <span className="stat-label">Places occupées</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon reserved">
            <Clock size={28} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{parkingStats.reserved}</span>
            <span className="stat-label">Réservées</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon total">
            <TrendingUp size={28} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{occupancyRate}%</span>
            <span className="stat-label">Taux d'occupation</span>
          </div>
        </div>
      </div>

      <section className="floors-section">
        <h2>Disponibilité par étage</h2>
        <div className="floors-grid">
          {floors.map((floor) => {
            const percent = floor.total > 0 ? Math.round((floor.available / floor.total) * 100) : 0
            return (
              <div key={floor.id} className="floor-card">
                <div className="floor-header">
                  <h3>{floor.name}</h3>
                  <span className="floor-available">{floor.available}/{floor.total}</span>
                </div>
                <div className="floor-bar">
                  <div
                    className="floor-bar-fill"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <Link to="/plan" className="floor-link">
                  Voir le plan →
                </Link>
              </div>
            )
          })}
        </div>
      </section>

      <ParkingProche />

      <div className="quick-actions">
        <Link to="/reservation" className="action-card primary">
          <span className="action-title">Réserver une place</span>
          <span className="action-desc">Réservez, arrivez sous 15 min et signalez pour démarrer le chrono</span>
        </Link>
        <Link to="/plan" className="action-card">
          <span className="action-title">Voir le plan</span>
          <span className="action-desc">Visualisez les places en temps réel</span>
        </Link>
      </div>
    </div>
  )
}
