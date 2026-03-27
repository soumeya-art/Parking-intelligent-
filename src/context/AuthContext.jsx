import { createContext, useContext, useState, useEffect } from 'react'
import { auth } from '../lib/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      return
    }
    auth.verify()
      .then((res) => {
        if (res.valid && res.user) {
          setUser(res.user)
        } else {
          localStorage.removeItem('token')
        }
      })
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, motDePasse, role = 'conducteur') => {
    const res = await auth.login(email, motDePasse, role)
    if (res.success) {
      localStorage.setItem('token', res.token)
      setUser(res.user)
      return res
    }
    throw new Error(res.error)
  }

  const register = async (nom, prenom, email, telephone, motDePasse) => {
    const res = await auth.register(nom, prenom, email, telephone, motDePasse)
    if (res.success) {
      localStorage.setItem('token', res.token)
      setUser(res.user)
      return res
    }
    throw new Error(res.error)
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  const updateUser = (newUser) => {
    setUser(prev => prev ? { ...prev, ...newUser } : null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
