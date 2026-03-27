import { useState, useEffect } from 'react'
import { parking } from '../../lib/api'
import { Plus, Save, CheckCircle } from 'lucide-react'
import './Admin.css'

export default function AdminTarifs() {
  const [tarifs, setTarifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [success, setSuccess] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [newTarif, setNewTarif] = useState({ description: 'Tarif MOUBARIK', montantHoraire: 200, montantJournalier: 3000 })

  const load = () => {
    parking.tarifs()
      .then((data) => setTarifs(Array.isArray(data) ? data : []))
      .catch(() => setTarifs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  const updateTarif = async (t) => {
    setSaving(t.idTarif)
    setSuccess(null)
    try {
      await parking.updateTarif(t.idTarif, t.description, t.montantHoraire, t.montantJournalier)
      load()
      setSuccess('Tarif enregistré avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(null)
    }
  }

  const createTarif = async () => {
    const { description, montantHoraire, montantJournalier } = newTarif
    if (!description?.trim()) {
      alert('Description requise')
      return
    }
    setSaving('new')
    setSuccess(null)
    try {
      await parking.createTarif(description.trim(), montantHoraire || 0, montantJournalier || 0)
      setShowNew(false)
      setNewTarif({ description: 'Tarif MOUBARIK', montantHoraire: 250, montantJournalier: 3000 })
      load()
      setSuccess('Tarif créé avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } catch (e) {
      alert(e.message)
    } finally {
      setSaving(null)
    }
  }

  if (loading) return <div className="admin-loading">Chargement...</div>

  return (
    <div className="admin-page">
      <h1>Gestion des tarifs</h1>
      <p className="subtitle">MOUBARIK Parking — Prix par tranche de 30 min + plafond journalier (FDJ)</p>

      {success && (
        <div className="tarif-success-msg">
          <CheckCircle size={20} /> {success}
        </div>
      )}

      <div className="tarifs-header">
        <p className="tarifs-hint">Le montant est calculé par tranche de 30 minutes. Ex: 200 FDJ = 200 FDJ pour 0-30 min, 400 FDJ pour 31-60 min, etc. Le journalier plafonne le total.</p>
        <button
          type="button"
          className="btn-primary tarif-add-btn"
          onClick={() => setShowNew(!showNew)}
        >
          <Plus size={18} /> Nouveau tarif
        </button>
      </div>

      {showNew && (
        <div className="tarif-card tarif-card-new">
          <h3>Créer un tarif</h3>
          <div className="tarif-form">
            <label>
              Description
              <input
                type="text"
                value={newTarif.description}
                onChange={(e) => setNewTarif(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Tarif standard - MOUBARIK Djibouti"
              />
            </label>
            <label>
              Par 30 min (FDJ)
              <input
                type="number"
                value={newTarif.montantHoraire}
                onChange={(e) => setNewTarif(prev => ({ ...prev, montantHoraire: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="50"
                placeholder="250"
              />
            </label>
            <label>
              Journalier (FDJ)
              <input
                type="number"
                value={newTarif.montantJournalier}
                onChange={(e) => setNewTarif(prev => ({ ...prev, montantJournalier: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="100"
              />
            </label>
          </div>
          <div className="tarif-actions">
            <button type="button" className="btn-secondary" onClick={() => setShowNew(false)}>Annuler</button>
            <button type="button" className="btn-primary" onClick={createTarif} disabled={saving === 'new'}>
              <Save size={16} /> {saving === 'new' ? 'Création...' : 'Créer'}
            </button>
          </div>
        </div>
      )}

      <div className="tarifs-list">
        {tarifs.length === 0 && !showNew && (
          <p className="tarifs-empty">Aucun tarif. Cliquez sur &quot;Nouveau tarif&quot; pour en créer un.</p>
        )}
        {tarifs.map((t) => (
          <div key={t.idTarif} className="tarif-card">
            <label className="tarif-desc-label">
              Description
              <input
                type="text"
                className="tarif-desc-input"
                value={t.description || ''}
                onChange={(e) => setTarifs(prev => prev.map(x => x.idTarif === t.idTarif ? { ...x, description: e.target.value } : x))}
                placeholder="Ex: Tarif standard"
              />
            </label>
            <div className="tarif-inputs">
              <label>
                Par 30 min (FDJ)
                <input
                  type="number"
                  value={t.montantHoraire ?? ''}
                  onChange={(e) => setTarifs(prev => prev.map(x => x.idTarif === t.idTarif ? { ...x, montantHoraire: parseFloat(e.target.value) || 0 } : x))}
                  min="0"
                  step="50"
                  placeholder="250"
                />
              </label>
              <label>
                Journalier (FDJ)
                <input
                  type="number"
                  value={t.montantJournalier ?? ''}
                  onChange={(e) => setTarifs(prev => prev.map(x => x.idTarif === t.idTarif ? { ...x, montantJournalier: parseFloat(e.target.value) || 0 } : x))}
                  min="0"
                  step="100"
                />
              </label>
            </div>
            <button
              onClick={() => updateTarif(t)}
              disabled={saving === t.idTarif}
              className="btn-primary"
            >
              <Save size={16} /> {saving === t.idTarif ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
