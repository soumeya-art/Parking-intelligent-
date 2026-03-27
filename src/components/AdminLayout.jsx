import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, MapPin, DollarSign, Calendar, LogOut, Shield, CreditCard, UserPlus, Users } from 'lucide-react'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import BackToTop from './BackToTop'
import './AdminLayout.css'

export default function AdminLayout({ children }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/connexion')
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <NavLink to="/admin" className="admin-logo">
          <Logo size={40} />
          <div>
            <span className="logo-text">MOUBARIK</span>
            <span className="logo-badge">Admin</span>
          </div>
        </NavLink>
        <nav className="admin-nav">
          <NavLink to="/admin" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <LayoutDashboard size={20} /> Tableau de bord
          </NavLink>
          <NavLink to="/admin/places" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <MapPin size={20} /> Places
          </NavLink>
          <NavLink to="/admin/tarifs" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <DollarSign size={20} /> Tarifs
          </NavLink>
          <NavLink to="/admin/reservations" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <Calendar size={20} /> Réservations
          </NavLink>
          <NavLink to="/admin/paiements" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <CreditCard size={20} /> Paiements
          </NavLink>
          <NavLink to="/admin/conducteurs" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <Users size={20} /> Conducteurs
          </NavLink>
          <NavLink to="/admin/admins" className={({ isActive }) => isActive ? 'admin-nav-link active' : 'admin-nav-link'}>
            <UserPlus size={20} /> Ajouter admin
          </NavLink>
        </nav>
        <div className="admin-user">
          <ThemeToggle />
          <Shield size={18} />
          <span>{user?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            <LogOut size={18} /> Déconnexion
          </button>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
      <BackToTop />
    </div>
  )
}
