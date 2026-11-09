import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'

/**
 * The "door guard" for admin pages: not logged in as admin -> go to the login page.
 * (The real protection is in the backend - this just keeps the screens tidy.)
 */
export default function RequireAdmin({ children }) {
  const { user, isAdmin } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  if (!isAdmin) {
    return <p className="p-10 text-center">This account doesn&apos;t have admin access.</p>
  }
  return children
}
