/** Jetons séparés pour ouvrir conducteur + admin dans deux onglets sans écrasement */

export const LEGACY_TOKEN_KEY = 'token'
export const TOKEN_CONDUCTEUR_KEY = 'moubarik_token_conducteur'
export const TOKEN_ADMIN_KEY = 'moubarik_token_admin'

export function isAdminPath(pathname) {
  return (pathname || '/').startsWith('/admin')
}

/** Jeton envoyé dans les appels API : suit l’URL de l’onglet */
export function getActiveToken() {
  if (typeof window === 'undefined') return null
  const path = window.location.pathname || '/'
  if (isAdminPath(path)) {
    return localStorage.getItem(TOKEN_ADMIN_KEY)
  }
  return localStorage.getItem(TOKEN_CONDUCTEUR_KEY)
}

export function setTokenForRole(role, token) {
  if (role === 'admin') {
    localStorage.setItem(TOKEN_ADMIN_KEY, token)
  } else {
    localStorage.setItem(TOKEN_CONDUCTEUR_KEY, token)
  }
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}

export function clearTokenForPath(pathname) {
  if (isAdminPath(pathname)) {
    localStorage.removeItem(TOKEN_ADMIN_KEY)
  } else {
    localStorage.removeItem(TOKEN_CONDUCTEUR_KEY)
  }
}

/** Ancienne clé unique `token` → répartir selon le rôle encodé dans le jeton */
export function migrateLegacyToken() {
  const leg = localStorage.getItem(LEGACY_TOKEN_KEY)
  if (!leg) return
  if (localStorage.getItem(TOKEN_CONDUCTEUR_KEY) || localStorage.getItem(TOKEN_ADMIN_KEY)) {
    localStorage.removeItem(LEGACY_TOKEN_KEY)
    return
  }
  try {
    const json = JSON.parse(atob(leg))
    if (json?.role === 'admin') {
      localStorage.setItem(TOKEN_ADMIN_KEY, leg)
    } else {
      localStorage.setItem(TOKEN_CONDUCTEUR_KEY, leg)
    }
  } catch {
    localStorage.setItem(TOKEN_CONDUCTEUR_KEY, leg)
  }
  localStorage.removeItem(LEGACY_TOKEN_KEY)
}
