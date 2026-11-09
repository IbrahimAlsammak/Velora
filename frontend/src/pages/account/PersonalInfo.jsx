import { useState } from 'react'
import { updateProfile } from '../../api/account.js'
import { errorMessage } from '../../api/client.js'
import { AuthField } from '../../components/AuthCard.jsx'
import { useAuth } from '../../context/useAuth.js'
import { formatPhone } from '../../utils/phone.js'

/** Change name + phone number. */
export default function PersonalInfo() {
  const { user } = useAuth()
  // key = start the form fresh after the details change
  return <DetailsForm key={`${user.fullName}|${user.phone}`} />
}

function DetailsForm() {
  const { user, updateUser } = useAuth()
  const [fullName, setFullName] = useState(user.fullName)
  const [phone, setPhone] = useState(formatPhone(user.phone))
  const [fieldErrors, setFieldErrors] = useState({})
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  const changed = fullName.trim() !== user.fullName || phone.trim() !== formatPhone(user.phone)

  async function handleSubmit(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    setFieldErrors({})
    try {
      updateUser(await updateProfile({ fullName, phone }))
      setMessage({ ok: true, text: '✓ Your details have been saved.' })
    } catch (err) {
      const fields = err.response?.data?.fields ?? {}
      setFieldErrors(fields)
      setMessage({ ok: false, text: Object.keys(fields).length ? 'Please check the fields above.' : errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <h2 className="font-display text-3xl">Personal information</h2>
      <p className="mt-1 text-sm text-mulberry/60">This is how we know you and how we reach you about your orders.</p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 max-w-xl rounded-2xl border border-gold-light bg-white/70 p-6 md:p-8">
        <AuthField label="Full name" autoComplete="name" value={fullName} error={fieldErrors.fullName}
          onChange={(e) => setFullName(e.target.value)} />
        <AuthField label="Phone number" type="tel" autoComplete="tel" placeholder="e.g. 03 123 456"
          value={phone} error={fieldErrors.phone} onChange={(e) => setPhone(e.target.value)} />
        <p className="-mt-2 mb-6 text-xs text-mulberry/60">
          You log in with this number, and we call or WhatsApp you on it about your orders.
        </p>

        {message && <p className={`mb-4 text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
        <button type="submit" disabled={busy || !changed}
          className="rounded-full bg-mulberry px-8 py-3 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold disabled:opacity-40">
          {busy ? 'Saving…' : 'Save changes'}
        </button>
      </form>
    </div>
  )
}
