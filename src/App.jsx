import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import AdminLayout from './components/AdminLayout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Accueil from './pages/Accueil'
import Dashboard from './pages/Dashboard'
import ParkingMap from './pages/ParkingMap'
import Reservation from './pages/Reservation'
import Historique from './pages/Historique'
import Profile from './pages/Profile'
import AdminDashboard from './pages/Admin/AdminDashboard'
import AdminPlaces from './pages/Admin/AdminPlaces'
import AdminTarifs from './pages/Admin/AdminTarifs'
import AdminReservations from './pages/Admin/AdminReservations'
import AdminPaiements from './pages/Admin/AdminPaiements'
import AdminConducteurs from './pages/Admin/AdminConducteurs'
import AdminAdmins from './pages/Admin/AdminAdmins'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loader" />
        <p>Chargement...</p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Accueil />} />
      <Route path="/connexion" element={<Login />} />
      <Route path="/inscription" element={<Register />} />
      <Route path="/mot-de-passe-oublie" element={<ForgotPassword />} />
      <Route path="/reinitialiser/:token" element={<ResetPassword />} />

      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminDashboard />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/places" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminPlaces />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/tarifs" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminTarifs />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/reservations" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminReservations />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/paiements" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminPaiements />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/conducteurs" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminConducteurs />
          </AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/admins" element={
        <ProtectedRoute requireAdmin>
          <AdminLayout>
            <AdminAdmins />
          </AdminLayout>
        </ProtectedRoute>
      } />

      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout>
            <Dashboard />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/plan" element={
        <ProtectedRoute>
          <Layout>
            <ParkingMap />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/reservation" element={
        <ProtectedRoute>
          <Layout>
            <Reservation />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/historique" element={
        <ProtectedRoute>
          <Layout>
            <Historique />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/profil" element={
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/admin' : '/dashboard') : '/'} replace />} />
    </Routes>
  )
}

export default App
