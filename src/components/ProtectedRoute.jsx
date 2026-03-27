import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <div className="auth-loading">Chargement...</div>

  if (!user) return <Navigate to="/connexion" state={{ from: location }} replace />

  if (requireAdmin && user.role !== 'admin') return <Navigate to="/dashboard" replace />

  return children
}
