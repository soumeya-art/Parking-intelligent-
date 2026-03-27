import { useState, useEffect } from 'react'
import { MapPin, Navigation } from 'lucide-react'
import { getEtablissements } from '../lib/parkingService'
import './ParkingProche.css'

// Parkings par défaut si l'API ne répond pas
const PARKINGS_DEFAUT = [
  { idEtablissement: 1, nom: 'MOUBARIK Centre', adresse: 'Place du 27 Juin, Djibouti', latitude: 11.5890, longitude: 43.1450 },
  { idEtablissement: 2, nom: 'MOUBARIK Ambouli', adresse: "Avenue de l'Aéroport, Djibouti", latitude: 11.5590, longitude: 43.1390 },
  { idEtablissement: 3, nom: 'MOUBARIK PK12', adresse: 'Route de Dikhil, Djibouti', latitude: 11.5240, longitude: 43.0780 },
]

function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return (R * c).toFixed(1)
}

export default function ParkingProche() {
  const [parkings, setParkings] = useState([])
  const [position, setPosition] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    getEtablissements()
      .then((data) => setParkings(Array.isArray(data) && data.length > 0 ? data : PARKINGS_DEFAUT))
      .catch(() => setParkings(PARKINGS_DEFAUT))
  }, [])

  const getPosition = () => {
    setLoading(true)
    setError(null)
    if (!navigator.geolocation) {
      setError('GPS non supporté par votre navigateur')
      setLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLoading(false)
      },
      () => {
        setError('Impossible d\'obtenir votre position. Autorisez la géolocalisation.')
        setLoading(false)
      }
    )
  }

  const listeParkings = position && parkings.length > 0
    ? parkings.map(p => ({
        ...p,
        distance: distanceKm(position.lat, position.lng, parseFloat(p.latitude), parseFloat(p.longitude))
      })).sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))
    : parkings

  const plusProche = position && listeParkings[0] && listeParkings[0].distance !== undefined ? listeParkings[0] : null

  return (
    <section className="parking-proche">
      <h2><MapPin size={22} /> Parkings MOUBARIK</h2>
      <p className="gps-desc">Trouvez le parking le plus proche ou consultez la liste</p>
      
      <button onClick={getPosition} className="gps-btn" disabled={loading}>
        <Navigation size={20} />
        {loading ? 'Localisation...' : 'Ma position'}
      </button>

      {error && <p className="gps-error">{error}</p>}

      {plusProche && (
        <div className="parking-card-nearest">
          <div className="parking-badge">Le plus proche de vous</div>
          <h3>{plusProche.nom}</h3>
          <p className="parking-adresse">{plusProche.adresse}</p>
          <p className="parking-distance">À {plusProche.distance} km</p>
          <a 
            href={`https://www.google.com/maps/dir/?api=1&destination=${plusProche.latitude},${plusProche.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="itineraire-btn"
          >
            <Navigation size={16} /> Itinéraire
          </a>
        </div>
      )}

      <div className="liste-parkings">
        <p className="liste-titre">{plusProche ? 'Autres parkings' : 'Nos parkings'}</p>
        {listeParkings.map((p) => (
          <div key={p.idEtablissement || p.nom} className={`parking-item ${plusProche && plusProche.nom === p.nom ? 'nearest' : ''}`}>
            <div>
              <span className="parking-nom">{p.nom}</span>
              <span className="parking-adresse-item">{p.adresse}</span>
            </div>
            {p.distance !== undefined && <span className="distance">{p.distance} km</span>}
            <a 
              href={`https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="itineraire-link"
            >
              Itinéraire →
            </a>
          </div>
        ))}
      </div>
    </section>
  )
}
