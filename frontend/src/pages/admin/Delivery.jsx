import { useState } from 'react'
import { getDelivery } from '../../api/catalog.js'
import { updateDelivery } from '../../api/admin.js'
import { errorMessage } from '../../api/client.js'
import { Button, Card, ErrorBox, Loading, PageHeader } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'

/**
 * Delivery: ONE fee for every order, anywhere in Lebanon,
 * plus optional free delivery above an amount.
 */
export default function Delivery() {
  const { data, error, loading, reload } = useLoad(getDelivery)

  return (
    <>
      <PageHeader title="Delivery fee" subtitle="One delivery fee for every order, anywhere in Lebanon" />
      <ErrorBox message={error} />
      {loading && !data && <Loading />}
      {/* key = refresh the form after saving */}
      {data && <DeliveryForm key={`${data.fee}|${data.freeDeliveryOver}`} info={data} onSaved={reload} />}
    </>
  )
}

function DeliveryForm({ info, onSaved }) {
  const [fee, setFee] = useState(String(info.fee ?? 0))
  const [freeOver, setFreeOver] = useState(info.freeDeliveryOver != null ? String(info.freeDeliveryOver) : '')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await updateDelivery(Number(fee || 0), freeOver === '' ? null : Number(freeOver))
      setMessage({ ok: true, text: '✓ Saved. New orders use this price.' })
      onSaved()
    } catch (err) {
      const fields = err.response?.data?.fields
      setMessage({ ok: false, text: fields ? Object.values(fields)[0] : errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="max-w-md">
      <form onSubmit={handleSave} className="space-y-5">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">
            Delivery fee
            <span className="block text-xs text-mulberry/50">every order pays this (0 = always free)</span>
          </span>
          <MoneyInput value={fee} onChange={setFee} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">
            Free delivery on orders of
            <span className="block text-xs text-mulberry/50">leave empty = never free</span>
          </span>
          <MoneyInput value={freeOver} onChange={setFreeOver} placeholder="e.g. 100" />
        </label>
        <p className="text-xs text-mulberry/60">
          Changing the fee only affects new orders. To change one order (e.g. one delivery for two orders),
          open the order and edit its delivery there.
        </p>
        {message && <p className={`text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Saving…' : 'Save'}</Button>
      </form>
    </Card>
  )
}

/** A "$ [ 4.00 ]" input. */
function MoneyInput({ value, onChange, placeholder }) {
  return (
    <span className="flex w-28 items-center rounded-lg border border-gold-light bg-white focus-within:border-gold">
      <span className="pl-3 text-sm text-mulberry/50">$</span>
      <input type="number" min="0" step="0.5" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent px-2 py-1.5 text-right outline-none" />
    </span>
  )
}
