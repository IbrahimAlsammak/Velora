import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client.js'
import AuthCard, { AuthField } from '../components/AuthCard.jsx'
import { useAuth } from '../context/useAuth.js'

export default function Login() {
  const { user, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const goTo = location.state?.from ?? '/' // home page - or back where they came from (e.g. checkout)

  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={goTo} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(phone, password)
      navigate(goTo, { replace: true })
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Welcome back" subtitle="Log in to see your orders and check out faster.">
      <form onSubmit={handleSubmit}>
        <AuthField label="Phone number" type="tel" autoComplete="tel" placeholder="e.g. 03 123 456" required
          value={phone} onChange={(e) => setPhone(e.target.value)} />
        <AuthField label="Password" type="password" autoComplete="current-password" required value={password}
          onChange={(e) => setPassword(e.target.value)} />
        <Link to="/forgot-password" className="-mt-2 mb-4 block text-right text-sm text-gold underline">
          Forgot password?
        </Link>

        {error && <p className="mb-4 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={busy}
          className="w-full rounded-full bg-mulberry py-3.5 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold disabled:opacity-50">
          {busy ? 'Logging in…' : 'Log in'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        New to Velora?{' '}
        <Link to="/register" state={location.state} className="text-gold underline">Create an account</Link>
      </p>
    </AuthCard>
  )
}
