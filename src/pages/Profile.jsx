import { useState } from 'react'
import { User, Mail, Phone, Lock, Save, CheckCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { auth } from '../lib/api'
import './Profile.css'

export default function Profile() {
  const { user, updateUser } = useAuth()
  const [nomPrenom, setNomPrenom] = useState(user ? `${user.nom || ''} ${user.prenom || ''}`.trim() : '')
  const [email, setEmail] = useState(user?.email || '')
  const [telephone, setTelephone] = useState(user?.telephone || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(null)
  const [error, setError] = useState('')

  if (!user || user.role !== 'conducteur') {
    return (
      <div className="profile-page">
        <p>Page réservée aux conducteurs.</p>
      </div>
    )
  }

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setError('')
    const parts = nomPrenom.trim().split(/\s+/)
    const nom = parts[0] || ''
    const prenom = parts.slice(1).join(' ') || parts[0] || ''
    if (!nom || !prenom) {
      setError('Nom et prénom requis')
      return
    }
    if (!email.trim()) {
      setError('Email requis')
      return
    }
    setSaving(true)
    try {
      const res = await auth.updateProfile(nom, prenom, email.trim(), telephone.trim() || undefined)
      if (res.user) updateUser(res.user)
      setSuccess('Profil mis à jour avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('Le nouveau mot de passe doit faire au moins 6 caractères')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    setSaving(true)
    try {
      await auth.changePassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setSuccess('Mot de passe modifié avec succès')
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="profile-page">
      <header className="page-header">
        <h1>Mon profil</h1>
        <p className="subtitle">MOUBARIK Parking — Modifiez vos informations</p>
      </header>

      {success && (
        <div className="profile-success">
          <CheckCircle size={20} /> {success}
        </div>
      )}

      {error && <div className="profile-error">{error}</div>}

      <div className="profile-card">
        <h2><User size={20} /> Informations personnelles</h2>
        <form onSubmit={handleSaveProfile} className="profile-form">
          <label>
            Nom / Prénom
            <input
              type="text"
              value={nomPrenom}
              onChange={(e) => setNomPrenom(e.target.value)}
              placeholder="Ex: Jean Dupont"
              required
            />
          </label>
          <label>
            <Mail size={18} /> Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@exemple.dj"
              required
            />
          </label>
          <label>
            <Phone size={18} /> Téléphone (optionnel)
            <input
              type="tel"
              value={telephone}
              onChange={(e) => setTelephone(e.target.value)}
              placeholder="Ex: +253 77 12 34 56"
            />
          </label>
          <button type="submit" className="btn-primary" disabled={saving}>
            <Save size={18} /> {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </form>
      </div>

      <div className="profile-card">
        <h2><Lock size={20} /> Changer le mot de passe</h2>
        <form onSubmit={handleChangePassword} className="profile-form">
          <label>
            Mot de passe actuel
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <label>
            Nouveau mot de passe (min. 6 caractères)
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              minLength={6}
            />
          </label>
          <label>
            Confirmer le nouveau mot de passe
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
          </label>
          <button type="submit" className="btn-secondary" disabled={saving || !currentPassword || !newPassword}>
            Modifier le mot de passe
          </button>
        </form>
      </div>
    </div>
  )
}
