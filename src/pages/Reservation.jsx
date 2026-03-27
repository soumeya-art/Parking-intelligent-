import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { MapPin, CheckCircle, Building2, Clock, Search } from 'lucide-react'
import { getSpots, createReservation, getEtablissements } from '../lib/parkingService'
import './Reservation.css'

const RESERVATION_CONFIRM_KEY = 'moubarik_reservation_confirm'

function loadConfirmedFromStorage() {
  try {
    const raw = sessionStorage.getItem(RESERVATION_CONFIRM_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    const age = Date.now() - (data.at || 0)
    if (age > 5 * 60 * 1000) return null
    return data
  } catch { return null }
}

export default function Reservation() {
  const [etablissements, setEtablissements] = useState([])
  const [searchParking, setSearchParking] = useState('')
  const [selectedEtablissement, setSelectedEtablissement] = useState(null)
  const [spots, setSpots] = useState([])
  const [floor, setFloor] = useState('RDC')
  const storedConfirm = loadConfirmedFromStorage()
  const [selectedSpot, setSelectedSpot] = useState(storedConfirm?.spot ?? null)
  const [confirmed, setConfirmed] = useState(!!storedConfirm)
  const [idReservation, setIdReservation] = useState(storedConfirm?.id ?? null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getEtablissements(searchParking).then(setEtablissements).catch(() => setEtablissements([]))
  }, [searchParking])

  const loadSpots = () => {
    if (!selectedEtablissement) return setSpots([])
    const today = new Date().toISOString().split('T')[0]
    getSpots(selectedEtablissement.idEtablissement, today).then(setSpots).catch(() => setSpots([]))
  }

  useEffect(loadSpots, [selectedEtablissement])

  useEffect(() => {
    if (!selectedEtablissement) return
    const iv = setInterval(loadSpots, 5000)
    return () => clearInterval(iv)
  }, [selectedEtablissement])

  const availableSpots = spots.filter(
    (s) => s.floor === floor && s.status === 'available'
  )

  const handleDemarrer = async () => {
    if (!selectedSpot) return
    setLoading(true)
    setError(null)
    const result = await createReservation(selectedSpot)
    setLoading(false)
    if (result.success) {
      if (result.idReservation) setIdReservation(result.idReservation)
      setConfirmed(true)
      try {
        sessionStorage.setItem(RESERVATION_CONFIRM_KEY, JSON.stringify({
          id: result.idReservation,
          spot: selectedSpot,
          at: Date.now()
        }))
      } catch {}
    } else {
      setError(typeof result.error === 'string' ? result.error : (result.error?.message || 'Erreur'))
    }
  }

  if (confirmed) {
    const spot = selectedSpot || loadConfirmedFromStorage()?.spot
    const ticketCode = idReservation && spot ? `MOUBARIK-${idReservation}-${spot}` : null
    return (
      <div className="reservation">
        <div className="confirmation-card">
          <div className="confirmation-icon">
            <CheckCircle size={64} />
          </div>
          <h1>Place réservée</h1>
          <p>Votre place <strong>{spot}</strong> est réservée.</p>
          {ticketCode && (
            <div className="confirmation-qr-ticket">
              <p>Présentez ce QR code à l&apos;entrée du parking</p>
              <QRCodeSVG value={ticketCode} size={140} level="M" className="confirmation-qr-svg" />
              <p className="confirmation-ticket-code">{ticketCode}</p>
            </div>
          )}
          <p className="confirmation-detail reservation-15min">
            <Clock size={20} /> Vous avez <strong>15 minutes</strong> pour arriver. Quand vous êtes sur place, cliquez sur &quot;Signaler mon arrivée&quot; dans le tableau de bord : c&apos;est à ce moment que le chrono démarre pour calculer les frais.
          </p>
          <Link to="/dashboard" className="btn-primary" onClick={() => sessionStorage.removeItem(RESERVATION_CONFIRM_KEY)}>
            Tableau de bord
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="reservation">
      <header className="page-header">
        <h1>Réserver une place</h1>
        <p className="subtitle">MOUBARIK Parking — Réservez, arrivez dans les 15 min et signalez pour démarrer le chrono</p>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <section className="parking-choice-section">
        <h2><Building2 size={20} /> Choisir le parking</h2>
        <p className="spots-hint">Recherchez par nom ou adresse, puis sélectionnez l&apos;établissement</p>
        <div className="reservation-search-wrap">
          <Search size={20} className="reservation-search-icon" />
          <input
            type="search"
            className="reservation-search-input"
            placeholder="Rechercher un parking (nom ou adresse)..."
            value={searchParking}
            onChange={(e) => setSearchParking(e.target.value)}
          />
        </div>
        <div className="etablissements-grid">
          {(etablissements.length ? etablissements : [
            { idEtablissement: 1, nom: 'MOUBARIK Centre', adresse: 'Place du 27 Juin, Djibouti' },
            { idEtablissement: 2, nom: 'MOUBARIK Ambouli', adresse: "Avenue de l'Aéroport, Djibouti" },
            { idEtablissement: 3, nom: 'MOUBARIK PK12', adresse: 'Route de Dikhil, Djibouti' },
          ]).map((e) => (
            <button
              key={e.idEtablissement}
              type="button"
              className={`etablissement-btn ${selectedEtablissement?.idEtablissement === e.idEtablissement ? 'selected' : ''}`}
              onClick={() => setSelectedEtablissement(selectedEtablissement?.idEtablissement === e.idEtablissement ? null : e)}
            >
              <span className="etablissement-nom">{e.nom}</span>
              <span className="etablissement-adresse">{e.adresse}</span>
            </button>
          ))}
        </div>
      </section>

      {selectedEtablissement && (
      <>
      <div className="reservation-form">
        <div className="form-row">
          <label><MapPin size={18} /> Étage</label>
          <select value={floor} onChange={(e) => setFloor(e.target.value)}>
            <option value="RDC">Rez-de-chaussée</option>
            <option value="B1">Sous-sol 1</option>
            <option value="B2">Sous-sol 2</option>
          </select>
        </div>
      </div>

      <section className="spots-selection">
        <h2>Choisir une place</h2>
        <p className="spots-hint">{availableSpots.length} place(s) disponible(s) • Le chrono démarre à votre signal d&apos;arrivée (sous 15 min)</p>
        <div className="spots-grid">
          {availableSpots.length === 0 ? (
            <p className="no-spots">Aucune place disponible à cet étage.</p>
          ) : (
            availableSpots.map((spot) => (
              <button key={spot.id} className={`spot-btn ${selectedSpot === spot.id ? 'selected' : ''}`} onClick={() => setSelectedSpot(spot.id)}>
                {spot.id}
              </button>
            ))
          )}
        </div>
      </section>

      <div className="reservation-actions">
        {!selectedSpot && (
          <p className="reservation-hint">Sélectionnez une place pour réserver.</p>
        )}
        <button
          className="btn-primary"
          onClick={handleDemarrer}
          disabled={!selectedSpot || loading}
        >
          {loading ? 'Réservation...' : 'Réserver'}
        </button>
      </div>
      </>
      )}

      {!selectedEtablissement && (
        <p className="reservation-hint">Choisissez d&apos;abord un parking.</p>
      )}
    </div>
  )
}
