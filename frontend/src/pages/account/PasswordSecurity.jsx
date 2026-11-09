import { useState } from 'react'
import { Link } from 'react-router-dom'
import { changePassword } from '../../api/account.js'
import { errorMessage } from '../../api/client.js'
import { AuthField } from '../../components/AuthCard.jsx'

const EMPTY = { currentPassword: '', newPassword: '', confirm: '' }

/** Change password (needs the current one). */
export default function PasswordSecurity() {
  const [form, setForm] = useState(EMPTY)
  const [show, setShow] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const type = show ? 'text' : 'password'

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage(null)
    setFieldErrors({})
    if (form.newPassword !== form.confirm) {
      setFieldErrors({ confirm: "The new passwords don't match" })
      return
    }
    setBusy(true)
    try {
      await changePassword(form.currentPassword, form.newPassword)
      setForm(EMPTY)
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
      <h2 className="font-display text-3xl">Password & security</h2>
      <p className="mt-1 text-sm text-mulberry/60">Choose a password you don't use anywhere else.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_260px]">
        <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-gold-light bg-white/70 p-6 md:p-8">
          <AuthField label="Current password" type={type} autoComplete="current-password"
            value={form.currentPassword} error={fieldErrors.currentPassword} onChange={update('currentPassword')} />
          <AuthField label="New password" type={type} autoComplete="new-password"
            value={form.newPassword} error={fieldErrors.newPassword} onChange={update('newPassword')} />
          <AuthField label="Repeat new password" type={type} autoComplete="new-password"
            value={form.confirm} error={fieldErrors.confirm} onChange={update('confirm')} />

          <label className="mb-6 flex cursor-pointer items-center gap-2 text-sm text-mulberry/70">
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} className="accent-mulberry" />
            Show passwords
          </label>

          {message && <p className={`mb-4 text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
          <button type="submit" disabled={busy || !form.currentPassword || !form.newPassword}
            className="rounded-full bg-mulberry px-8 py-3 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold disabled:opacity-40">
            {busy ? 'Saving…' : 'Update password'}
          </button>
        </form>

        <aside className="h-fit rounded-2xl bg-white/50 p-6 text-sm">
          <p className="font-medium">A good password</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-mulberry/70">
            <li>has at least 8 characters</li>
            <li>mixes letters and numbers</li>
            <li>isn't your name or phone number</li>
          </ul>
          <p className="mt-4 text-mulberry/70">
            Forgot your current password? <Link to="/forgot-password" className="text-gold underline">Get help</Link>
          </p>
        </aside>
      </div>
    </div>
  )
}
