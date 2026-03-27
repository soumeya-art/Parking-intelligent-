import { useState, useEffect } from 'react'
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
  const [evaluableIds, setEvaluableIds] = useState(new Set())

  const load = () => {
    getReservations()
      .then((data) => setHistory(Array.isArray(data) ? data : []))
      .catch(() => setHistory([]))
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
    history.forEach((item) => {
      if (item.status === 'terminée' && item.montant > 0) {
        parking.avisEvaluable(item.id).then((r) => {
          if (r?.evaluable) setEvaluableIds((s) => new Set([...s, item.id]))
        }).catch(() => {})
      }
    })
  }, [history])

  const handleAvisSubmit = async () => {
    if (!avisFor || avisNote < 1) return
    setAvisSubmitting(true)
    try {
      const res = await parking.avisSubmit(avisFor, avisNote, avisComment)
      if (res?.success) {
        setEvaluableIds((s) => { const n = new Set(s); n.delete(avisFor); return n })
        setAvisFor(null)
        setAvisNote(0)
        setAvisComment('')
      }
    } catch {}
    setAvisSubmitting(false)
  }

  const canDownloadPDF = (item) => item.status === 'terminée' && (item.montant ?? 0) > 0

  const list = Array.isArray(history) ? history : []

  return (
    <div className="historique">
      <header className="page-header">
        <h1>Historique des réservations</h1>
        <p className="subtitle">MOUBARIK Parking Djibouti • Vos réservations passées et à venir</p>
      </header>

      <div className="history-list">
        {list.length === 0 && (
          <p className="empty-state">Aucune réservation pour le moment.</p>
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
                {item.status === 'terminée' && evaluableIds.has(item.id) && (
                  <button
                    type="button"
                    className="history-avis-btn"
                    onClick={() => setAvisFor(avisFor === item.id ? null : item.id)}
                  >
                    <Star size={16} /> Évaluer
                  </button>
                )}
              </div>
              {ticketFor === item.id && (
                <div className="history-ticket-qr">
                  <p>Présentez ce QR code à l&apos;entrée du parking</p>
                  <QRCodeSVG value={`MOUBARIK-${item.id}-${item.spot}`} size={120} level="M" />
                  <p className="ticket-code">MOUBARIK-{item.id}-{item.spot}</p>
                </div>
              )}
              {avisFor === item.id && (
                <div className="history-avis-form">
                  <p>Comment était cette session ?</p>
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
                    placeholder="Commentaire (optionnel)"
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
                    {avisSubmitting ? 'Envoi...' : 'Envoyer l\'avis'}
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
