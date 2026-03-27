// API MOUBARIK - Backend WAMP/PHP
// En dev: utilise le proxy Vite (/api) - même origine, pas de CORS
// En prod ou si VITE_API_URL est défini: URL complète
import { getActiveToken } from './tokens'

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '/api' : '/api')

function getToken() {
  return getActiveToken()
}

export async function api(endpoint, options = {}) {
  const base = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL
  const url = base ? `${base}/${endpoint}` : `/${endpoint}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(url, { ...options, headers })
  const text = await res.text()
  let data = {}
  try { data = text ? JSON.parse(text) : {} } catch {}
  const err = data?.error || data?.message
  if (!res.ok) throw new Error(err || `Erreur ${res.status}`)
  return data
}

// Auth
export const auth = {
  login: (email, motDePasse, role = 'conducteur') =>
    api('auth.php', { method: 'POST', body: JSON.stringify({ action: 'login', email, motDePasse, role }) }),
  register: (nom, prenom, email, telephone, motDePasse) =>
    api('auth.php', { method: 'POST', body: JSON.stringify({ action: 'register', nom, prenom, email, telephone, motDePasse }) }),
  /** Vérifie un jeton précis (corps de la requête ; ne dépend pas du chemin de la page) */
  verifyToken: (token) =>
    token
      ? api('auth.php', { method: 'POST', body: JSON.stringify({ action: 'verify', token }) })
      : Promise.resolve({ valid: false }),
  forgotPassword: (email) =>
    api('auth.php', { method: 'POST', body: JSON.stringify({ action: 'forgot-password', email, baseUrl: window.location.origin }) }),
  resetPassword: (token, motDePasse) =>
    api('auth.php', { method: 'POST', body: JSON.stringify({ action: 'reset-password', token, motDePasse }) }),
  updateProfile: (nom, prenom, email, telephone) =>
    api('auth.php', { method: 'POST', body: JSON.stringify({ action: 'profile-update', nom, prenom, email, telephone }) }),
  changePassword: (motDePasseActuel, nouveauMotDePasse) =>
    api('auth.php', { method: 'POST', body: JSON.stringify({ action: 'change-password', motDePasseActuel, nouveauMotDePasse }) }),
}

// Admin - gestion utilisateurs
export const adminUsers = {
  addAdmin: (nom, email, motDePasse) =>
    api('auth.php', { method: 'POST', body: JSON.stringify({ action: 'admin-add-admin', nom, email, motDePasse }) }),
  getConducteurs: () =>
    api('auth.php', { method: 'POST', body: JSON.stringify({ action: 'admin-conducteurs' }) }),
  deleteConducteur: (idConducteur) =>
    api('auth.php', { method: 'POST', body: JSON.stringify({ action: 'admin-delete-conducteur', idConducteur }) }),
}

// Parking
export const parking = {
  stats: () => api('parking.php?action=stats'),
  places: (idEtablissement, date) => {
    let u = 'parking.php?action=places'
    if (idEtablissement) u += `&idEtablissement=${idEtablissement}`
    if (date) u += `&date=${encodeURIComponent(date)}`
    return api(u)
  },
  floors: () => api('parking.php?action=floors'),
  reservations: () => api('parking.php?action=reservations'),
  annulerReservation: (idReservation) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'annuler-reservation', idReservation }) }),
  reserve: (spotId) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'reserve', spotId, token: getToken() }) }),
  signalerArrivee: (idReservation) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'signaler-arrivee', idReservation }) }),
  sessionActive: () => api('parking.php?action=session-active'),
  terminerSession: (idReservation) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'terminer-session', idReservation }) }),
  payerSession: (idReservation, idSysteme, paymentPhone) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'payer-session', idReservation, idSysteme, paymentPhone }) }),
  tarifs: () => api('parking.php?action=tarifs'),
  updateTarif: (id, description, montantHoraire, montantJournalier) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'tarif-update', id, description, montantHoraire, montantJournalier }) }),
  createTarif: (description, montantHoraire, montantJournalier) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'tarif-create', description, montantHoraire, montantJournalier }) }),
  updatePlace: (idPlace, statut) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'place-update', idPlace, statut }) }),
  rapport: () => api('parking.php?action=rapport'),
  tarifsPublic: () => api('parking.php?action=tarifs-public'),
  systemesPaiement: () => api('parking.php?action=systemes-paiement'),
  etablissements: (search) => api(`parking.php?action=etablissements${search ? '&q=' + encodeURIComponent(search) : ''}`),
  paiementsEnAttente: () => api('parking.php?action=paiements-en-attente'),
  confirmerPaiement: (idPaiement) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'confirmer-paiement', idPaiement }) }),
  notifications: () => api('parking.php?action=notifications'),
  marquerNotificationLue: (id) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'notification-lue', idNotification: id }) }),
  avisEvaluable: (idReservation) =>
    api('parking.php', {
      method: 'POST',
      body: JSON.stringify({
        action: 'avis-reservation-evaluable',
        idReservation,
        token: getToken(),
      }),
    }),
  avisSubmit: (idReservation, note, commentaire) =>
    api('parking.php', { method: 'POST', body: JSON.stringify({ action: 'avis-submit', idReservation, note, commentaire }) }),
}
