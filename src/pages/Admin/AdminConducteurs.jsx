import { useState, useEffect } from 'react'
import { adminUsers } from '../../lib/api'
import { User, Mail, Phone, Trash2 } from 'lucide-react'
import './Admin.css'

export default function AdminConducteurs() {
  const [conducteurs, setConducteurs] = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  const load = () => {
    setLoading(true)
    adminUsers.getConducteurs()
      .then((r) => setConducteurs(r.conducteurs || []))
      .catch(() => setConducteurs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const handleDelete = async (c) => {
    if (!confirm(`Supprimer le conducteur ${c.nom} ${c.prenom} (${c.email}) ? Toutes ses réservations seront supprimées.`)) return
    setDeleting(c.idConducteur)
    try {
      await adminUsers.deleteConducteur(c.idConducteur)
      load()
    } catch (e) {
      alert(e.message)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) return <div className="admin-loading">Chargement...</div>

  return (
    <div className="admin-page">
      <h1>Gestion des conducteurs</h1>
      <p className="subtitle">MOUBARIK Parking — Liste des conducteurs • Suppression possible</p>

      <div className="conducteurs-list">
        {conducteurs.length === 0 ? (
          <p className="conducteurs-empty">Aucun conducteur inscrit.</p>
        ) : (
          conducteurs.map((c) => (
            <div key={c.idConducteur} className="conducteur-card">
              <div className="conducteur-info">
                <div className="conducteur-icon">
                  <User size={24} />
                </div>
                <div>
                  <span className="conducteur-nom">{c.nom} {c.prenom}</span>
                  <div className="conducteur-details">
                    <span><Mail size={14} /> {c.email}</span>
                    {c.telephone && <span><Phone size={14} /> {c.telephone}</span>}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="conducteur-delete-btn"
                onClick={() => handleDelete(c)}
                disabled={deleting === c.idConducteur}
                title="Supprimer ce conducteur"
              >
                <Trash2 size={18} /> {deleting === c.idConducteur ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
