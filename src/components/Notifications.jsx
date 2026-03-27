import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { parking } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import './Notifications.css'

export default function Notifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)

  const refresh = () => {
    if (user?.role === 'conducteur') {
      parking.notifications().then(setNotifications).catch(() => setNotifications([]))
    }
  }

  useEffect(() => {
    refresh()
  }, [user?.id])

  // Polling temps réel toutes les 30 s quand conducteur connecté
  useEffect(() => {
    if (user?.role !== 'conducteur') return
    const iv = setInterval(refresh, 30000)
    return () => clearInterval(iv)
  }, [user?.id, user?.role])

  const unreadCount = notifications.filter(n => !n.lu).length

  const markAsRead = async (id) => {
    try {
      await parking.marquerNotificationLue(id)
      setNotifications(prev => prev.map(n => n.idNotification === id ? { ...n, lu: 1 } : n))
    } catch (e) {}
  }

  if (user?.role !== 'conducteur') return null

  return (
    <div className="notifications-wrap">
      <button
        type="button"
        className="notifications-btn"
        onClick={() => {
          if (!open) refresh()
          setOpen(!open)
        }}
        aria-label="Notifications"
        title="Voir les notifications"
      >
        <Bell size={20} aria-hidden />
        {unreadCount > 0 && <span className="notifications-badge">{unreadCount}</span>}
      </button>
      {open && (
        <>
          <div className="notifications-backdrop" onClick={() => setOpen(false)} />
          <div className="notifications-dropdown">
            <h4>Notifications</h4>
            {notifications.length === 0 ? (
              <p className="notifications-empty">Aucune notification</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.idNotification}
                  className={`notification-item ${n.lu ? '' : 'unread'}`}
                  onClick={() => { markAsRead(n.idNotification); setOpen(false); }}
                >
                  <p>{n.message}</p>
                  <span className="notification-date">
                    {new Date(n.dateNotification).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
