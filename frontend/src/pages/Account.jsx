import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { changePassword, getMyOrders, updateProfile } from '../api/account.js'
import { errorMessage } from '../api/client.js'
import { AuthField } from '../components/AuthCard.jsx'
import { useAuth } from '../context/useAuth.js'
import useLoad from '../hooks/useLoad.js'
import formatDate from '../utils/formatDate.js'
import { formatPhone } from '../utils/phone.js'
import formatPrice from '../utils/formatPrice.js'

const STATUS_TEXT = {
  PENDING: 'Received - waiting for confirmation',
  PAID: 'Confirmed',
  SHIPPED: 'On its way',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
}

export default function Account() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/login" replace state={{ from: '/account' }} />

  return (
    <section className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-gold">My account</p>
          <h1 className="mt-1 font-display text-4xl md:text-5xl font-semibold">Hello, {user.fullName.split(' ')[0]}</h1>
          <p className="mt-1 text-sm text-mulberry/60">{user.phone ? formatPhone(user.phone) : user.email}</p>
        </div>
        <button type="button" onClick={() => { logout(); navigate('/') }}
          className="rounded-full border border-gold-light px-6 py-2 text-sm uppercase tracking-wider hover:border-gold hover:text-gold">
          Log out
        </button>
      </div>

      <MyOrders />
      <div className="mt-14 grid gap-12 md:grid-cols-2">
        {/* key = refresh the form after the details change */}
        <MyDetails key={`${user.fullName}|${user.phone}`} />
        <ChangePassword />
      </div>
    </section>
  )
}

/** Change name + phone number. */
function MyDetails() {
  const { user, updateUser } = useAuth()
  const [fullName, setFullName] = useState(user.fullName)
  const [phone, setPhone] = useState(formatPhone(user.phone))
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      updateUser(await updateProfile({ fullName, phone }))
      setMessage({ ok: true, text: '✓ Your details have been saved.' })
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.fields?.fullName ?? errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2 className="font-display text-3xl">My details</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <AuthField label="Full name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <AuthField label="Phone number (you log in with this)" type="tel" autoComplete="tel"
          placeholder="e.g. 03 123 456" value={phone} onChange={(e) => setPhone(e.target.value)} />
        {message && <p className={`mb-4 text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
        <button type="submit" disabled={busy}
          className="rounded-full bg-mulberry px-8 py-3 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold disabled:opacity-50">
          {busy ? 'Saving…' : 'Save details'}
        </button>
      </form>
    </div>
  )
}

function MyOrders() {
  const { data: orders, error, loading } = useLoad(getMyOrders)

  return (
    <div className="mt-12">
      <h2 className="font-display text-3xl">My orders</h2>
      {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
      {loading && <p className="mt-4 text-gold">Loading…</p>}
      {orders && orders.length === 0 && (
        <p className="mt-4 text-mulberry/70">
          No orders yet. <Link to="/shop" className="text-gold underline">Start shopping</Link>
        </p>
      )}
      {orders && orders.length > 0 && (
        <ul className="mt-4 divide-y divide-gold-light/60 rounded-2xl border border-gold-light bg-white/60">
          {orders.map((o) => (
            <li key={o.orderNumber}>
              <Link to={`/order/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-gold-light/15">
                <span>
                  <span className="font-medium tracking-wider">{o.orderNumber}</span>
                  <span className="block text-sm text-mulberry/60">
                    {formatDate(o.createdAt)} · {o.itemCount} {o.itemCount === 1 ? 'item' : 'items'}
                  </span>
                </span>
                <span className="text-right">
                  <span className="font-medium">{formatPrice(o.total)}</span>
                  <span className={`block text-sm ${o.status === 'CANCELLED' ? 'text-mulberry/50' : 'text-gold'}`}>
                    {STATUS_TEXT[o.status]}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function ChangePassword() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '' })
  const [fieldErrors, setFieldErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    setFieldErrors({})
    try {
      await changePassword(form.currentPassword, form.newPassword)
      setForm({ currentPassword: '', newPassword: '' })
      setMessage({ ok: true, text: '✓ Your password has been changed.' })
    } catch (err) {
      setFieldErrors(err.response?.data?.fields ?? {})
      setMessage({ ok: false, text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2 className="font-display text-3xl">Change password</h2>
      <form onSubmit={handleSubmit} noValidate className="mt-4">
        <AuthField label="Current password" type="password" autoComplete="current-password"
          value={form.currentPassword} error={fieldErrors.currentPassword}
          onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} />
        <AuthField label="New password (at least 8 characters)" type="password" autoComplete="new-password"
          value={form.newPassword} error={fieldErrors.newPassword}
          onChange={(e) => setForm({ ...form, newPassword: e.target.value })} />
        {message && <p className={`mb-4 text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
        <button type="submit" disabled={busy}
          className="rounded-full bg-mulberry px-8 py-3 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold disabled:opacity-50">
          {busy ? 'Saving…' : 'Update password'}
        </button>
      </form>
    </div>
  )
}
