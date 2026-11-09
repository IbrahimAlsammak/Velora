import { useState } from 'react'
import { deleteCustomer, getCustomers, setCustomerPassword } from '../../api/admin.js'
import { errorMessage } from '../../api/client.js'
import { inputClass } from '../../components/admin/styles.js'
import { Button, Card, ErrorBox, Loading, PageHeader } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatDate from '../../utils/formatDate.js'
import { formatPhone, whatsappUrl } from '../../utils/phone.js'

export default function Customers() {
  const { data: customers, error, loading, reload } = useLoad(getCustomers)
  const [search, setSearch] = useState('')
  const [openId, setOpenId] = useState(null) // the customer whose "new password" box is open
  const [actionError, setActionError] = useState(null)

  async function handleDelete(c) {
    const question = `Delete the account of ${c.fullName}?\n\nThey won't be able to log in anymore. ` +
      `Their ${c.orderCount} order(s) are kept in Orders (as guest orders). This cannot be undone.`
    if (!window.confirm(question)) return
    setActionError(null)
    try {
      await deleteCustomer(c.id)
      reload()
    } catch (err) {
      setActionError(errorMessage(err))
    }
  }

  const shown = (customers ?? []).filter((c) =>
    `${c.fullName} ${c.phone ?? ''} ${formatPhone(c.phone)} ${c.email ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <>
      <PageHeader title="Customers" subtitle={customers ? `${customers.length} accounts` : null} />

      <input type="search" placeholder="Search by name or phone…" value={search}
        onChange={(e) => setSearch(e.target.value)} className={`mb-6 max-w-sm ${inputClass}`} />

      <ErrorBox message={error || actionError} />
      {loading && <Loading />}

      {customers && (
        <Card className="p-0">
          {shown.length === 0 ? (
            <p className="p-6 text-sm text-mulberry/60">
              {customers.length === 0 ? 'No customer accounts yet.' : 'No customers match.'}
            </p>
          ) : (
            <ul className="divide-y divide-gold-light/50">
              {shown.map((c) => (
                <li key={c.id} className="px-5 py-4">
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="mr-auto">
                      <p className="font-medium">{c.fullName}</p>
                      {c.phone ? (
                        <p className="text-sm text-mulberry/60">
                          {formatPhone(c.phone)}
                          <a href={whatsappUrl(c.phone)} target="_blank" rel="noreferrer" className="ml-3 text-gold hover:underline">WhatsApp</a>
                        </p>
                      ) : (
                        <p className="text-sm text-mulberry/60">{c.email}</p>
                      )}
                    </div>
                    <span className="text-sm text-mulberry/60">
                      {c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'} · joined {formatDate(c.createdAt)}
                    </span>
                    <Button variant="secondary" onClick={() => setOpenId(openId === c.id ? null : c.id)}>
                      {openId === c.id ? 'Close' : 'Set new password'}
                    </Button>
                    <Button variant="danger" onClick={() => handleDelete(c)}>Delete</Button>
                  </div>
                  {openId === c.id && <NewPasswordForm customer={c} onDone={() => setOpenId(null)} />}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </>
  )
}

/** Give a customer a new password - no current password needed. */
function NewPasswordForm({ customer, onDone }) {
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await setCustomerPassword(customer.id, password)
      setMessage({ ok: true, text: `✓ Saved. Tell ${customer.fullName.split(' ')[0]} the new password - they can change it in their account.` })
      setPassword('')
      setTimeout(onDone, 6000)
    } catch (err) {
      setMessage({ ok: false, text: err.response?.data?.fields?.newPassword ?? errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-4 rounded-xl border border-gold bg-white p-4">
      <p className="text-sm">New password for <strong>{customer.fullName}</strong> (at least 8 characters):</p>
      <div className="mt-2 flex flex-wrap gap-2">
        <input type="text" autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)}
          className={`max-w-xs ${inputClass}`} placeholder="New password" />
        <Button type="submit" disabled={busy || password.length === 0}>{busy ? 'Saving…' : 'Save'}</Button>
      </div>
      {message && <p className={`mt-2 text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
    </form>
  )
}
