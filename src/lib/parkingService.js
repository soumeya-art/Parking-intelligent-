// MOUBARIK Parking - Utilise l'API PHP/WAMP
import { parking } from './api'
import { parkingStats as mockStats, floors as mockFloors, spots as mockSpots } from '../data/parkingData'

export async function getParkingStats() {
  try {
    return await parking.stats()
  } catch {
    return mockStats
  }
}

export async function getFloors() {
  try {
    return await parking.floors()
  } catch {
    return mockFloors
  }
}

export async function getSpots(idEtablissement, date) {
  try {
    const data = await parking.places(idEtablissement, date)
    return data.map(p => ({
      id: p.numero,
      idPlace: p.idPlace,
      floor: p.floor,
      zone: p.zone,
      status: p.status,
    }))
  } catch {
    return mockSpots
  }
}

/** Historique conducteur uniquement — pas de données fictives : si l’API échoue, la liste est vide. */
export async function getReservations() {
  const data = await parking.reservations()
  return Array.isArray(data) ? data : []
}

export async function annulerReservation(idReservation) {
  const res = await parking.annulerReservation(idReservation)
  return res
}

export async function createReservation(spotId) {
  try {
    const res = await parking.reserve(spotId)
    if (res.success) return { success: true, idReservation: res.idReservation }
    return { success: false, error: res.error || 'Erreur serveur' }
  } catch (err) {
    return { success: false, error: err.message || 'Connexion impossible. Vérifiez que WAMP est démarré.' }
  }
}

export async function signalerArrivee(idReservation) {
  try {
    const res = await parking.signalerArrivee(idReservation)
    if (res.success) return { success: true, idReservation: res.idReservation }
    return { success: false, error: res.error || 'Erreur serveur' }
  } catch (err) {
    return { success: false, error: err.message || 'Impossible de signaler l\'arrivée.' }
  }
}

export async function getTarifsPublic() {
  try {
    return await parking.tarifsPublic()
  } catch {
    return [{ montantHoraire: 250, montantJournalier: 3000 }]
  }
}

export async function getSystemesPaiement() {
  try {
    return await parking.systemesPaiement()
  } catch {
    return [
    { idSysteme: 1, typeSysteme: 'D-Money (Mobile Money)' },
    { idSysteme: 2, typeSysteme: 'Espèces (FDJ)' }
  ]
  }
}

export async function getSessionActive() {
  try {
    return await parking.sessionActive()
  } catch {
    return { active: false }
  }
}

export async function terminerSession(idReservation) {
  return await parking.terminerSession(idReservation)
}

export async function payerSession(idReservation, idSysteme, paymentPhone) {
  return await parking.payerSession(idReservation, idSysteme, paymentPhone)
}

export async function getEtablissements(search = '') {
  try {
    return await parking.etablissements(search)
  } catch {
    return []
  }
}
