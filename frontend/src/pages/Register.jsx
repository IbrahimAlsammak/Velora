import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { errorMessage } from '../api/client.js'
import AuthCard, { AuthField } from '../components/AuthCard.jsx'
import { useAuth } from '../context/useAuth.js'

export default function Register() {
  const { user, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const goTo = location.state?.from ?? '/account'

  const [form, setForm] = useState({ fullName: '', phone: '', password: '', confirm: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  if (user) return <Navigate to={goTo} replace />

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setFieldErrors({})
    if (form.password !== form.confirm) {
      setFieldErrors({ confirm: "The passwords don't match" })
      return
    }
    setBusy(true)
    try {
      await register(form.fullName, form.phone, form.password)
      navigate(goTo, { replace: true })
    } catch (err) {
      setFieldErrors(err.response?.data?.fields ?? {})
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <AuthCard title="Create an account" subtitle="Track your orders and check out faster next time.">
      <form onSubmit={handleSubmit} noValidate>
        <AuthField label="Full name" autoComplete="name" value={form.fullName} onChange={update('fullName')}
          error={fieldErrors.fullName} />
        <AuthField label="Phone number" type="tel" autoComplete="tel" placeholder="e.g. 03 123 456"
          value={form.phone} onChange={update('phone')} error={fieldErrors.phone} />
        <AuthField label="Password (at least 8 characters)" type="password" autoComplete="new-password"
          value={form.password} onChange={update('password')} error={fieldErrors.password} />
        <AuthField label="Repeat password" type="password" autoComplete="new-password"
          value={form.confirm} onChange={update('confirm')} error={fieldErrors.confirm} />

        {error && !Object.keys(fieldErrors).length && <p className="mb-4 text-sm text-red-700">{error}</p>}

        <button type="submit" disabled={busy}
          className="w-full rounded-full bg-mulberry py-3.5 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold disabled:opacity-50">
          {busy ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p className="mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link to="/login" state={location.state} className="text-gold underline">Log in</Link>
      </p>
    </AuthCard>
  )
}
