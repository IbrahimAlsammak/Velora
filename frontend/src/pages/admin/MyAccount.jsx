import { useState } from 'react'
import { updateProfile } from '../../api/account.js'
import { setMyAdminPassword } from '../../api/admin.js'
import { errorMessage } from '../../api/client.js'
import { inputClass } from '../../components/admin/styles.js'
import { Button, Card, Field, PageHeader } from '../../components/admin/ui.jsx'
import { useAuth } from '../../context/useAuth.js'

/** The admin's own account: name + login email, and password (no current password needed). */
export default function MyAccount() {
  const { user } = useAuth()
  return (
    <>
      <PageHeader title="My account" subtitle="Your admin details and password" />
      <div className="grid max-w-4xl gap-6 lg:grid-cols-2">
        <MyDetails key={`${user?.fullName}|${user?.email}`} />
        <MyPassword />
      </div>
      <p className="mt-6 max-w-2xl text-sm text-mulberry/60">
        Forgot your password? Open <code>application-secrets.properties</code>, put a <strong>new</strong> password
        in <code>velora.admin.password</code>, save, and restart the backend.
      </p>
    </>
  )
}

function MyDetails() {
  const { user, updateUser } = useAuth()
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      updateUser(await updateProfile({ fullName, email }))
      setMessage({ ok: true, text: '✓ Saved. Use this email next time you log in.' })
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2 className="font-display text-2xl">My details</h2>
      <form onSubmit={handleSave} noValidate className="mt-4 space-y-4">
        <Field label="Name">
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Login email">
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </Field>
        {message && <p className={`text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save details'}</Button>
      </form>
    </Card>
  )
}

function MyPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setMessage(null)
    if (password !== confirm) {
      setMessage({ ok: false, text: "The passwords don't match." })
      return
    }
    setBusy(true)
    try {
      await setMyAdminPassword(password)
      setMessage({ ok: true, text: '✓ Your password has been changed.' })
      setPassword('')
      setConfirm('')
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.fields?.newPassword ?? errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <h2 className="font-display text-2xl">Change password</h2>
      <form onSubmit={handleSave} noValidate className="mt-4 space-y-4">
        <Field label="New password (at least 10 characters recommended)">
          <input type="password" autoComplete="new-password" className={inputClass}
            value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <Field label="Repeat new password">
          <input type="password" autoComplete="new-password" className={inputClass}
            value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {message && <p className={`text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
        <Button type="submit" disabled={busy || !password}>{busy ? 'Saving…' : 'Change password'}</Button>
      </form>
    </Card>
  )
}
