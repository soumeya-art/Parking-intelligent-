import { createContext, useContext, useState, useEffect, useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { auth } from '../lib/api'
import {
  migrateLegacyToken,
  TOKEN_CONDUCTEUR_KEY,
  TOKEN_ADMIN_KEY,
  setTokenForRole,
  clearTokenForPath,
} from '../lib/tokens'

const AuthContext = createContext(null)

async function fetchUsersFromStorage() {
  const cTok = localStorage.getItem(TOKEN_CONDUCTEUR_KEY)
  const aTok = localStorage.getItem(TOKEN_ADMIN_KEY)
  const [cRes, aRes] = await Promise.all([
    cTok ? auth.verifyToken(cTok) : Promise.resolve({ valid: false }),
    aTok ? auth.verifyToken(aTok) : Promise.resolve({ valid: false }),
  ])
  return {
    conducteur: cRes.valid && cRes.user ? cRes.user : null,
    admin: aRes.valid && aRes.user ? aRes.user : null,
    dropConducteurToken: Boolean(cTok && !(cRes.valid && cRes.user)),
    dropAdminToken: Boolean(aTok && !(aRes.valid && aRes.user)),
  }
}

export function AuthProvider({ children }) {
  const location = useLocation()
  const [conducteurUser, setConducteurUser] = useState(null)
  const [adminUser, setAdminUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const user = useMemo(() => {
    return location.pathname.startsWith('/admin') ? adminUser : conducteurUser
  }, [location.pathname, adminUser, conducteurUser])

  useEffect(() => {
    migrateLegacyToken()
    let cancelled = false
    setLoading(true)
    fetchUsersFromStorage()
      .then((r) => {
        if (cancelled) return
        if (r.dropConducteurToken) localStorage.removeItem(TOKEN_CONDUCTEUR_KEY)
        if (r.dropAdminToken) localStorage.removeItem(TOKEN_ADMIN_KEY)
        setConducteurUser(r.conducteur)
        setAdminUser(r.admin)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  /** Connexion / déconnexion dans un autre onglet (même origine) */
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key !== TOKEN_CONDUCTEUR_KEY && e.key !== TOKEN_ADMIN_KEY) return
      fetchUsersFromStorage().then((r) => {
        if (r.dropConducteurToken) localStorage.removeItem(TOKEN_CONDUCTEUR_KEY)
        if (r.dropAdminToken) localStorage.removeItem(TOKEN_ADMIN_KEY)
        setConducteurUser(r.conducteur)
        setAdminUser(r.admin)
      })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const login = async (email, motDePasse, role = 'conducteur') => {
    const res = await auth.login(email, motDePasse, role)
    if (res.success) {
      setTokenForRole(res.user.role, res.token)
      if (res.user.role === 'admin') {
        setAdminUser(res.user)
      } else {
        setConducteurUser(res.user)
      }
      return res
    }
    throw new Error(res.error)
  }

  const register = async (nom, prenom, email, telephone, motDePasse) => {
    const res = await auth.register(nom, prenom, email, telephone, motDePasse)
    if (res.success) {
      setTokenForRole('conducteur', res.token)
      setConducteurUser(res.user)
      return res
    }
    throw new Error(res.error)
  }

  const logout = () => {
    clearTokenForPath(location.pathname)
    if (location.pathname.startsWith('/admin')) {
      setAdminUser(null)
    } else {
      setConducteurUser(null)
    }
  }

  const updateUser = (newUser) => {
    setConducteurUser((prev) => (prev ? { ...prev, ...newUser } : null))
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, conducteurUser, adminUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
