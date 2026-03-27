import { useState, useEffect } from 'react'
import { Car, MapPin, DollarSign, Calendar, Activity } from 'lucide-react'
import { parking } from '../../lib/api'
import './Admin.css'

export default function AdminDashboard() {
  const [rapport, setRapport] = useState(null)

  const load = () => {
    parking.rapport().then(setRapport).catch(() => setRapport({
      placesTotal: 45, placesDispo: 20, placesOccupees: 0, placesReservees: 0, reservationsToday: 0, revenueToday: 0
    }))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const iv = setInterval(load, 2000)
    return () => clearInterval(iv)
  }, [])

  if (!rapport) return <div className="admin-loading">Chargement...</div>

  return (
    <div className="admin-page">
      <h1>Tableau de bord Admin</h1>
      <p className="subtitle">
        MOUBARIK Parking — Gestion en temps réel
        <span className="admin-realtime-badge"><Activity size={14} /> Mis à jour toutes les 2 s</span>
      </p>

      <div className="admin-stats">
        <div className="admin-stat-card">
          <Car size={28} />
          <div>
            <span className="stat-value">{rapport.placesTotal}</span>
            <span className="stat-label">Places totales</span>
          </div>
        </div>
        <div className="admin-stat-card stat-available">
          <MapPin size={28} />
          <div>
            <span className="stat-value">{rapport.placesDispo}</span>
            <span className="stat-label">Disponibles</span>
          </div>
        </div>
        <div className="admin-stat-card stat-occupied">
          <Activity size={28} />
          <div>
            <span className="stat-value">{rapport.placesOccupees ?? 0}</span>
            <span className="stat-label">Occupées (chrono en cours)</span>
          </div>
        </div>
        <div className="admin-stat-card stat-reserved">
          <Calendar size={28} />
          <div>
            <span className="stat-value">{rapport.placesReservees ?? 0}</span>
            <span className="stat-label">Réservées (en attente)</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <DollarSign size={28} />
          <div>
            <span className="stat-value">{rapport.revenueToday} FDJ</span>
            <span className="stat-label">Revenus du jour</span>
          </div>
        </div>
      </div>
    </div>
  )
}
