import { useState, useEffect } from 'react'
import { getSpots } from '../lib/parkingService'
import './ParkingMap.css'

const STATUS_LABELS = {
  available: 'Disponible',
  occupied: 'Occupée',
  reserved: 'Réservée',
}

export default function ParkingMap() {
  const [spots, setSpots] = useState([])
  const [selectedFloor, setSelectedFloor] = useState('RDC')
  const [selectedSpot, setSelectedSpot] = useState(null)

  useEffect(() => {
    getSpots().then(setSpots)
  }, [])

  const floorSpots = spots.filter((s) => s.floor === selectedFloor)
  const zones = [...new Set(floorSpots.map((s) => s.zone))].sort()

  return (
    <div className="parking-map">
      <header className="page-header">
        <h1>Plan du parking</h1>
        <p className="subtitle">MOUBARIK Parking Djibouti • Sélectionnez un étage</p>
      </header>

      <div className="floor-tabs">
        {['RDC', 'B1', 'B2'].map((floor) => (
          <button
            key={floor}
            className={`floor-tab ${selectedFloor === floor ? 'active' : ''}`}
            onClick={() => setSelectedFloor(floor)}
          >
            {floor === 'RDC' ? 'Rez-de-chaussée' : `Sous-sol ${floor.slice(1)}`}
          </button>
        ))}
      </div>

      <div className="legend">
        <span className="legend-item"><span className="dot available" /> Disponible</span>
        <span className="legend-item"><span className="dot occupied" /> Occupée</span>
        <span className="legend-item"><span className="dot reserved" /> Réservée</span>
      </div>

      <div className="map-container">
        {zones.map((zone) => (
          <div key={zone} className="zone-section">
            <h3 className="zone-title">Zone {zone}</h3>
            <div className="spots-row">
              {floorSpots
                .filter((s) => s.zone === zone)
                .map((spot) => (
                  <button
                    key={spot.id}
                    className={`spot ${spot.status} ${selectedSpot === spot.id ? 'selected' : ''}`}
                    onClick={() => setSelectedSpot(spot.id === selectedSpot ? null : spot.id)}
                    title={`${spot.id} - ${STATUS_LABELS[spot.status]}`}
                  >
                    {spot.id.split('-')[1]}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {selectedSpot && (
        <div className="spot-detail">
          {(() => {
            const spot = spots.find((s) => s.id === selectedSpot)
            if (!spot) return null
            return (
              <>
                <h3>Place {spot.id}</h3>
                <p>Statut: <strong>{STATUS_LABELS[spot.status]}</strong></p>
                <p>Zone {spot.zone} • Étage {spot.floor}</p>
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
