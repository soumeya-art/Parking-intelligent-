import { useState, useEffect } from 'react'
import { parking } from '../../lib/api'
import { CreditCard, CheckCircle, History } from 'lucide-react'
import './Admin.css'

export default function AdminPaiements() {
  const [paiements, setPaiements] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const load = () => {
    setLoadError(null)
    parking.paiementsEnAttente()
      .then((data) => {
        setPaiements(Array.isArray(data?.pending) ? data.pending : (Array.isArray(data) ? data : []))
        setRecent(Array.isArray(data?.recent) ? data.recent : [])
      })
      .catch((err) => {
        setPaiements([])
        setRecent([])
        setLoadError(err?.message || 'Erreur de chargement')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  useEffect(() => {
    const iv = setInterval(load, 5000)
    return () => clearInterval(iv)
  }, [])

  const [confirmError, setConfirmError] = useState(null)

  const handleConfirm = async (idPaiement) => {
    setConfirming(idPaiement)
    setConfirmError(null)
    try {
      await parking.confirmerPaiement(idPaiement)
      load()
    } catch (err) {
      setConfirmError(err?.message || 'Impossible de confirmer. Vérifiez que vous êtes connecté en tant qu\'admin.')
    }
    setConfirming(null)
  }

  const formatDate = (s) => {
    if (!s) return '—'
    const d = new Date(s)
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const nomClient = (p) => (p.nom || p.prenom) ? `${p.nom || ''} ${p.prenom || ''}`.trim() || '—' : '—'

  if (loading) return <div className="admin-loading">Chargement...</div>

  const pendingList = Array.isArray(paiements) ? paiements : []
  const recentList = Array.isArray(recent) ? recent : []

  return (
    <div className="admin-page">
      <h1><CreditCard size={28} /> Paiements</h1>
      <p className="subtitle">
        Les paiements <strong>D-Money</strong> et <strong>espèces</strong> restent en attente jusqu&apos;à confirmation par un administrateur (réception effective). Le conducteur reçoit alors une notification de validation.
      </p>

      {loadError && <div className="error-banner">{loadError}</div>}
      {confirmError && <div className="error-banner">{confirmError}</div>}

      <h2 className="paiements-section-title">À confirmer (D-Money &amp; espèces)</h2>
      <div className="paiements-table">
        {pendingList.length === 0 ? (
          <p className="empty">Aucun paiement en attente. Les demandes apparaissent ici lorsqu&apos;un conducteur a validé un mode de paiement après sa session.</p>
        ) : (
          pendingList.map((p) => (
            <div key={p.idPaiement} className="paiement-row">
              <span className="col-numero">Place {p.numero}</span>
              <span className="col-date">{formatDate(p.dateDebut)}</span>
              <span className="col-montant">{p.montant} FDJ</span>
              <span className="col-methode">{p.methodePaiement || '—'}</span>
              <span className="col-client">{nomClient(p)}</span>
              <span className="col-tel">{p.telephone || '—'}</span>
              <button
                className="btn-confirm-paiement"
                onClick={() => handleConfirm(p.idPaiement)}
                disabled={confirming === p.idPaiement}
              >
                {confirming === p.idPaiement ? '...' : <><CheckCircle size={18} /> Confirmer</>}
              </button>
            </div>
          ))
        )}
      </div>

      {recentList.length > 0 && (
        <>
          <h2 className="paiements-section-title"><History size={20} /> Derniers paiements</h2>
          <div className="paiements-table paiements-recent">
            {recentList.map((p) => (
              <div key={p.idPaiement} className={`paiement-row ${p.statut === 'pending' ? 'pending' : 'done'}`}>
                <span className="col-numero">Place {p.numero}</span>
                <span className="col-date">{formatDate(p.dateP)}</span>
                <span className="col-montant">{p.montant} FDJ</span>
                <span className="col-methode">{p.methodePaiement || '—'}</span>
                <span className="col-client">{nomClient(p)}</span>
                <span className="col-statut">{p.statut === 'pending' ? 'En attente' : 'Confirmé'}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
