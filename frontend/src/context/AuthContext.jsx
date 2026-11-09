import { useEffect, useMemo, useState } from 'react'
import api, { getToken, setToken } from '../api/client.js'
import { AuthContext } from './useAuth.js'

/**
 * Remembers who is logged in, for every page.
 * The token itself lives in localStorage (see api/client.js); here we keep the user's details.
 */
const USER_KEY = 'velora-user'

function loadUser() {
  try {
    return getToken() ? JSON.parse(localStorage.getItem(USER_KEY)) : null
  } catch {
    return null
  }
}

function saveUser(user) {
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user))
    else localStorage.removeItem(USER_KEY)
  } catch {
    /* ignore */
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser)

  useEffect(() => {
    // The backend rejected our token (expired) -> forget the user
    const onLogout = () => {
      saveUser(null)
      setUser(null)
    }
    window.addEventListener('velora-logout', onLogout)

    // On page load, double-check the saved token is still valid
    if (getToken()) {
      api.get('/auth/me').then((res) => {
        saveUser(res.data)
        setUser(res.data)
      }).catch(() => {})
    }
    return () => window.removeEventListener('velora-logout', onLogout)
  }, [])

  const value = useMemo(() => ({
    user,
    isAdmin: user?.role === 'ADMIN',
    /** login = phone number (customers) or email (admin) */
    async login(login, password) {
      const res = await api.post('/auth/login', { login, password })
      setToken(res.data.token)
      saveUser(res.data.user)
      setUser(res.data.user)
      return res.data.user
    },
    async register(fullName, phone, password) {
      const res = await api.post('/auth/register', { fullName, phone, password })
      setToken(res.data.token)
      saveUser(res.data.user)
      setUser(res.data.user)
      return res.data.user
    },
    /** After "My details" is saved: remember the new name/phone/email. */
    updateUser(updated) {
      saveUser(updated)
      setUser(updated)
    },
    logout() {
      setToken(null)
      saveUser(null)
      setUser(null)
    },
  }), [user])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
