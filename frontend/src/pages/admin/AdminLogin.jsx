import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../../api/client.js'
import logo from '../../assets/velora-logo.svg'
import { inputClass } from '../../components/admin/styles.js'
import { useAuth } from '../../context/useAuth.js'

export default function AdminLogin() {
  const { login, logout, isAdmin } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (isAdmin) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const user = await login(email, password)
      if (user.role !== 'ADMIN') {
        logout() // a customer account can't use the admin panel
        setError('This account is not an admin.')
        setBusy(false)
        return
      }
      navigate(location.state?.from ?? '/admin', { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-gold-light bg-white/70 p-8">
        <img src={logo} alt="Velora" className="mx-auto h-14" />
        <h1 className="mt-6 text-center font-display text-3xl">Admin login</h1>

        <label className="mt-8 block">
          <span className="text-xs uppercase tracking-wider">Email</span>
          <input type="email" autoComplete="username" required value={email}
            onChange={(e) => setEmail(e.target.value)} className={`mt-1 ${inputClass}`} />
        </label>
        <label className="mt-4 block">
          <span className="text-xs uppercase tracking-wider">Password</span>
          <input type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} className={`mt-1 ${inputClass}`} />
        </label>

        {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={busy}
          className="mt-6 w-full rounded-full bg-mulberry py-3 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold disabled:opacity-50">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
    </div>
  )
}
