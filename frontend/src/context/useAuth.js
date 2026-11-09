import { createContext, useContext } from 'react'

/** Who is logged in. Filled by <AuthProvider> in AuthContext.jsx */
export const AuthContext = createContext(null)

/** Use inside any component: const { user, login, logout } = useAuth() */
export function useAuth() {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>')
  return auth
}
