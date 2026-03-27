import { useState, useEffect } from 'react'
import { parking } from '../../lib/api'
import './Admin.css'

const STATUTS = ['available', 'occupied', 'reserved']
const STATUT_LABELS = { available: 'Disponible', occupied: 'Occupée', reserved: 'Réservée' }

export default function AdminPlaces() {
  const [places, setPlaces] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    parking.places().then(setPlaces).catch(() => setPlaces([])).finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const iv = setInterval(load, 2000)
    return () => clearInterval(iv)
  }, [])

  const updateStatut = async (idPlace, statut) => {
    try {
      await parking.updatePlace(idPlace, statut)
      load()
    } catch (e) {
      alert(e.message)
    }
  }

  if (loading) return <div className="admin-loading">Chargement...</div>

  return (
    <div className="admin-page">
      <h1>Gestion des places</h1>
      <p className="subtitle">Mise à jour en temps réel (2 s) • Occupé = chrono en cours, Réservé = en attente d&apos;arrivée</p>

      <div className="places-grid">
        {places.map((p) => (
          <div key={p.id} className={`place-admin-card ${p.status}`}>
            <span className="place-numero">{p.id}</span>
            <select
              value={p.status}
              onChange={(e) => updateStatut(p.idPlace, e.target.value)}
              className="place-select"
            >
              {STATUTS.map(s => (
                <option key={s} value={s}>{STATUT_LABELS[s]}</option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  )
}
