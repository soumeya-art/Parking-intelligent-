import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Map, CalendarCheck, History, LogOut, User } from 'lucide-react'
import Logo from './Logo'
import Notifications from './Notifications'
import ThemeToggle from './ThemeToggle'
import { useAuth } from '../context/AuthContext'
import './Header.css'

export default function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="header-inner">
        <NavLink to="/dashboard" className="logo">
          <Logo size={40} />
          <div className="logo-text-wrap">
            <span className="logo-text">MOUBARIK Parking</span>
            <span className="logo-location">Djibouti</span>
          </div>
        </NavLink>
        <nav className="nav">
          <NavLink to="/dashboard" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <LayoutDashboard size={18} />
            Tableau de bord
          </NavLink>
          <NavLink to="/plan" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <Map size={18} />
            Plan du parking
          </NavLink>
          <NavLink to="/reservation" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <CalendarCheck size={18} />
            Réserver
          </NavLink>
          <NavLink to="/historique" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
            <History size={18} />
            Historique
          </NavLink>
          {user?.role === 'conducteur' && (
            <NavLink to="/profil" className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}>
              <User size={18} />
              Profil
            </NavLink>
          )}
        </nav>
        <ThemeToggle />
        {user && (
          <div className="header-user">
            <Notifications />
            <NavLink to={user.role === 'conducteur' ? '/profil' : '#'} className="user-name">
              {user.prenom || user.nom}
            </NavLink>
            <button onClick={() => { logout(); navigate('/connexion') }} className="logout-btn-header">
              <LogOut size={18} /> Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
