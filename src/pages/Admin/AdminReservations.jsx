import { useState, useEffect } from 'react'
import { parking } from '../../lib/api'
import './Admin.css'

export default function AdminReservations() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setError(null)
    parking.reservations()
      .then((data) => {
        setReservations(Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        setReservations([])
        setError(err?.message || 'Impossible de charger les réservations. Vérifiez que WAMP est démarré.')
      })
      .finally(() => setLoading(false))
  }, [])

  const list = Array.isArray(reservations) ? reservations : []

  if (loading) return <div className="admin-loading">Chargement...</div>

  return (
    <div className="admin-page">
      <h1>Réservations</h1>
      <p className="subtitle">Toutes les réservations du parking</p>

      {error && <div className="error-banner" style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className="reservations-table">
        {list.length === 0 ? (
          <p className="empty">{error ? '—' : 'Aucune réservation'}</p>
        ) : (
          list.map((r) => (
            <div key={r.id} className={`reservation-row ${r.status === 'à venir' ? 'upcoming' : ''}`}>
              <span className="col-spot">Place {r.spot}</span>
              <span className="col-date">{r.date}</span>
              <span className="col-time">{r.startTime} - {r.endTime}</span>
              <span className="col-status">{r.status}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
