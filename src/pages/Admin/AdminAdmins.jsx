import { useState } from 'react'
import { adminUsers } from '../../lib/api'
import { Plus, Save, Shield, CheckCircle } from 'lucide-react'
import './Admin.css'

export default function AdminAdmins() {
  const [nom, setNom] = useState('')
  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (!nom.trim() || !email.trim() || motDePasse.length < 6) {
      setError('Nom, email et mot de passe (min. 6 caractères) requis')
      return
    }
    setLoading(true)
    try {
      await adminUsers.addAdmin(nom.trim(), email.trim(), motDePasse)
      setSuccess('Administrateur ajouté avec succès')
      setNom('')
      setEmail('')
      setMotDePasse('')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'ajout')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-page">
      <h1>Ajouter un administrateur</h1>
      <p className="subtitle">MOUBARIK Parking — Créer un nouveau compte administrateur</p>

      {success && (
        <div className="tarif-success-msg">
          <CheckCircle size={20} /> {success}
        </div>
      )}
      {error && (
        <div className="error-banner">{error}</div>
      )}

      <div className="admin-form-card">
        <form onSubmit={handleSubmit} className="admin-add-form">
          <div className="admin-form-icon">
            <Shield size={40} />
          </div>
          <label>
            Nom complet
            <input
              type="text"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Ex: Jean Dupont"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@moubarik.dj"
              required
            />
          </label>
          <label>
            Mot de passe (min. 6 caractères)
            <input
              type="password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              placeholder="••••••••"
              minLength={6}
              required
            />
          </label>
          <button type="submit" className="btn-primary" disabled={loading}>
            <Save size={18} /> {loading ? 'Ajout...' : 'Ajouter l\'administrateur'}
          </button>
        </form>
      </div>
    </div>
  )
}
