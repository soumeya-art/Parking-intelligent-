import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Receipt, MapPin, Clock, Car, XCircle, QrCode, FileDown, Star } from 'lucide-react'
import { getReservations, annulerReservation } from '../lib/parkingService'
import { parking } from '../lib/api'
import { genererFacturePDF } from '../lib/pdfFacture'
import './Historique.css'

export default function Historique() {
  const [history, setHistory] = useState([])
  const [cancelling, setCancelling] = useState(null)
  const [ticketFor, setTicketFor] = useState(null)
  const [avisFor, setAvisFor] = useState(null)
  const [avisNote, setAvisNote] = useState(0)
  const [avisComment, setAvisComment] = useState('')
  const [avisSubmitting, setAvisSubmitting] = useState(false)
  /** Par id réservation : état chargement + éligibilité avis (API avis-reservation-evaluable) */
  const [avisInfo, setAvisInfo] = useState({})
  const [historyError, setHistoryError] = useState(null)

  const load = () => {
    setHistoryError(null)
    getReservations()
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch((e) => {
        setHistory([])
        setHistoryError(e?.message || 'Impossible de charger l’historique. Vérifiez que le serveur PHP tourne (ex: npm run dev:api).')
      })
  }

  useEffect(() => {
    load()
  }, [])

  const canAnnuler = (item) => {
    if (item.statut === 'cancelled' || item.status === 'annulée') return false
    if (item.status === 'en attente') return true
    if (item.status === 'à venir' && item.dateDebut) {
      const debut = new Date(item.dateDebut)
      const minAnnulable = new Date(Date.now() + 2 * 60 * 60 * 1000)
      return debut > minAnnulable
    }
    return false
  }

  const handleAnnuler = async (item) => {
    if (!canAnnuler(item)) return
    setCancelling(item.id)
    try {
      const res = await annulerReservation(item.id)
      if (res?.success) load()
    } catch {}
    setCancelling(null)
  }

  useEffect(() => {
    const terminated = history.filter(
      (item) => String(item.status).toLowerCase() === 'terminée' && item.statut !== 'cancelled'
    )
    if (terminated.length === 0) {
      setAvisInfo({})
      return undefined
    }
    setAvisInfo((prev) => {
      const next = { ...prev }
      terminated.forEach((item) => {
        next[item.id] = { ...(next[item.id] || {}), loading: true }
      })
      return next
    })
    let cancelled = false
    Promise.all(
      terminated.map((item) =>
        parking.avisEvaluable(item.id)
          .then((r) => ({
            id: item.id,
            evaluable: !!r?.evaluable,
            pendingPaymentConfirmation: !!r?.pendingPaymentConfirmation,
            hasReview: !!r?.hasReview,
          }))
          .catch(() => ({
            id: item.id,
            evaluable: false,
            pendingPaymentConfirmation: false,
            hasReview: false,
            fetchError: true,
          }))
      )
    ).then((results) => {
      if (cancelled) return
      setAvisInfo((prev) => {
        const next = { ...prev }
        for (const r of results) {
          next[r.id] = {
            loading: false,
            evaluable: r.evaluable,
            pendingPayment: r.pendingPaymentConfirmation,
            hasReview: r.hasReview,
            fetchError: !!r.fetchError,
          }
        }
        return next
      })
    })
    return () => { cancelled = true }
  }, [history])

  const handleAvisSubmit = async () => {
    if (!avisFor || avisNote < 1) return
    setAvisSubmitting(true)
    try {
      const res = await parking.avisSubmit(avisFor, avisNote, avisComment)
      if (res?.success) {
        setAvisInfo((prev) => ({
          ...prev,
          [avisFor]: {
            loading: false,
            evaluable: false,
            pendingPayment: false,
            hasReview: true,
            fetchError: false,
          },
        }))
        setAvisFor(null)
        setAvisNote(0)
        setAvisComment('')
      } else {
        alert(res?.error || 'Impossible d\'envoyer l\'avis.')
      }
    } catch (e) {
      alert(e?.message || 'Erreur réseau.')
    }
    setAvisSubmitting(false)
  }

  const canDownloadPDF = (item) => String(item.status).toLowerCase() === 'terminée' && (item.montant ?? 0) > 0

  const list = Array.isArray(history) ? history : []

  return (
    <div className="historique">
      <header className="page-header">
        <h1>Historique des réservations</h1>
        <p className="subtitle">MOUBARIK Parking Djibouti • Vos réservations passées et à venir</p>
        <p className="subtitle historique-avis-subtitle">
          Après une session <strong>terminée</strong> et un <strong>paiement enregistré</strong> (depuis le tableau de bord), vous pouvez noter le <strong>parking</strong> et la <strong>place</strong> (accès, propreté, confort…). Ce n&apos;est pas un avis sur une personne.
        </p>
      </header>

      {historyError && (
        <div className="historique-error-banner" role="alert">
          {historyError}
        </div>
      )}

      <div className="history-list">
        {list.length === 0 && !historyError && (
          <p className="empty-state">Aucune réservation pour le moment.</p>
        )}
        {list.length === 0 && historyError && (
          <p className="empty-state">Historique indisponible tant que le serveur ne répond pas.</p>
        )}
        {list.map((item) => (
          <div
            key={item.id}
            className={`history-card ${(item.status === 'à venir' || item.status === 'en attente') ? 'upcoming' : ''} ${item.status === 'annulée' ? 'cancelled' : ''}`}
          >
            <div className="history-icon">
              <Receipt size={24} />
            </div>
            <div className="history-content">
              <div className="history-spot">
                <MapPin size={16} />
                Place {item.spot}
              </div>
              <div className="history-datetime">
                <Clock size={16} />
                {item.date} • {item.startTime} - {item.endTime}
              </div>
              <div className="history-meta">
                <span className="duration">
                  <Car size={14} />
                  {item.duration}
                </span>
                <span className={`status-badge ${(item.status === 'à venir' || item.status === 'en attente') ? 'upcoming' : ''} ${item.status === 'annulée' ? 'cancelled' : ''}`}>
                  {item.status}
                </span>
                {canAnnuler(item) && (
                  <button
                    type="button"
                    className="history-annuler-btn"
                    onClick={() => handleAnnuler(item)}
                    disabled={cancelling === item.id}
                  >
                    <XCircle size={16} /> {cancelling === item.id ? 'Annulation...' : 'Annuler'}
                  </button>
                )}
                {(item.status === 'à venir' || item.status === 'en attente' || item.status === 'en cours' || item.status === 'terminée') && item.statut !== 'cancelled' && (
                  <button
                    type="button"
                    className="history-ticket-btn"
                    onClick={() => setTicketFor(ticketFor === item.id ? null : item.id)}
                  >
                    <QrCode size={16} /> Ticket
                  </button>
                )}
                {canDownloadPDF(item) && (
                  <button
                    type="button"
                    className="history-pdf-btn"
                    onClick={() => genererFacturePDF(item)}
                  >
                    <FileDown size={16} /> PDF
                  </button>
                )}
              </div>

              {String(item.status).toLowerCase() === 'terminée' && item.statut !== 'cancelled' && (
                <div className="history-avis-section">
                  <h4 className="history-avis-section-title"><Star size={18} /> Avis conducteur (parking &amp; place)</h4>
                  {avisInfo[item.id]?.loading && (
                    <p className="history-avis-loading">Vérification…</p>
                  )}
                  {!avisInfo[item.id]?.loading && avisInfo[item.id]?.fetchError && (
                    <p className="history-avis-error">Impossible de joindre le serveur pour les avis. Réessayez plus tard.</p>
                  )}
                  {!avisInfo[item.id]?.loading && !avisInfo[item.id]?.fetchError && avisInfo[item.id]?.hasReview && (
                    <p className="history-avis-done">Merci : vous avez déjà laissé un avis pour cette session (place {item.spot}).</p>
                  )}
                  {!avisInfo[item.id]?.loading && !avisInfo[item.id]?.fetchError && !avisInfo[item.id]?.hasReview && avisInfo[item.id]?.evaluable && (
                    <>
                      {avisInfo[item.id]?.pendingPayment && (
                        <p className="history-avis-hint history-avis-hint-block">
                          Paiement <strong>en attente</strong> de validation par l&apos;admin : vous pouvez quand même <strong>noter votre expérience</strong> sur le parking et cette place.
                        </p>
                      )}
                      <button
                        type="button"
                        className="history-avis-btn history-avis-btn-block"
                        title={`Noter le parking pour la place ${item.spot}`}
                        onClick={() => setAvisFor(avisFor === item.id ? null : item.id)}
                      >
                        <Star size={18} /> Laisser mon avis sur cette place ({item.spot})
                      </button>
                    </>
                  )}
                  {!avisInfo[item.id]?.loading && !avisInfo[item.id]?.fetchError && !avisInfo[item.id]?.hasReview && !avisInfo[item.id]?.evaluable && !avisInfo[item.id]?.pendingPayment && (
                    <p className="history-avis-locked">
                      Pour déposer un avis : allez sur le <Link to="/dashboard">tableau de bord</Link>, terminez la session (<em>Je pars</em>), effectuez le paiement, puis attendez la confirmation admin. Si vous voyez ce message sans avoir payé, enregistrez d&apos;abord le paiement pour cette réservation.
                    </p>
                  )}
                </div>
              )}
              {ticketFor === item.id && (
                <div className="history-ticket-qr">
                  <p>Présentez ce QR code à l&apos;entrée du parking</p>
                  <QRCodeSVG value={`MOUBARIK-${item.id}-${item.spot}`} size={120} level="M" />
                  <p className="ticket-code">MOUBARIK-{item.id}-{item.spot}</p>
                </div>
              )}
              {avisFor === item.id && (
                <div className="history-avis-form">
                  <p className="history-avis-form-title">Votre avis sur le parking — place {item.spot}</p>
                  <p className="history-avis-form-desc">Notez votre expérience globale sur ce stationnement (emplacement, accès, sécurité, propreté…). Ce formulaire concerne cette réservation précise.</p>
                  <div className="avis-stars">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        className={`avis-star-btn ${avisNote >= n ? 'active' : ''}`}
                        onClick={() => setAvisNote(n)}
                      >
                        <Star size={28} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    className="avis-comment-input"
                    placeholder="Ex. : place facile à repérer, parking calme, améliorations souhaitées… (optionnel)"
                    value={avisComment}
                    onChange={(e) => setAvisComment(e.target.value)}
                    rows={3}
                  />
                  <button
                    type="button"
                    className="btn-primary avis-submit-btn"
                    onClick={handleAvisSubmit}
                    disabled={avisNote < 1 || avisSubmitting}
                  >
                    {avisSubmitting ? 'Envoi...' : 'Publier l\'avis sur cette place'}
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
