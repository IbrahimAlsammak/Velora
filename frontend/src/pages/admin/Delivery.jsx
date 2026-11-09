import { useState } from 'react'
import { getDelivery } from '../../api/catalog.js'
import { addDeliveryCity, deleteDeliveryCity, updateDelivery, updateDeliveryCity } from '../../api/admin.js'
import { errorMessage } from '../../api/client.js'
import { inputClass } from '../../components/admin/styles.js'
import { Button, Card, ErrorBox, Loading, PageHeader } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatPrice from '../../utils/formatPrice.js'

/**
 * Delivery prices by CITY:
 *  - a list of cities, each with its own price (customers choose from it at checkout)
 *  - one price for any other city
 *  - optional free delivery above an amount
 */
export default function Delivery() {
  const { data, error, loading, reload } = useLoad(getDelivery)

  return (
    <>
      <PageHeader title="Delivery fees" subtitle="Customers choose their city at checkout and pay its delivery price" />
      <ErrorBox message={error} />
      {loading && !data && <Loading />}
      {data && (
        <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
          <CityPrices info={data} onChanged={reload} />
          {/* key = refresh the form after saving */}
          <OtherSettings key={`${data.otherCitiesFee}|${data.freeDeliveryOver}`} info={data} onSaved={reload} />
        </div>
      )}
    </>
  )
}

/** The list of cities with their price: add, edit, remove. */
function CityPrices({ info, onChanged }) {
  const [editingId, setEditingId] = useState(null) // a city id, or 'new'
  const [search, setSearch] = useState('')
  const [actionError, setActionError] = useState(null)

  const shown = info.cities.filter((c) => c.name.toLowerCase().includes(search.trim().toLowerCase()))

  async function handleDelete(city) {
    if (!window.confirm(`Remove ${city.name}? Customers from there will pay the "other cities" price.`)) return
    setActionError(null)
    try {
      await deleteDeliveryCity(city.id)
      onChanged()
    } catch (err) {
      setActionError(errorMessage(err))
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl">Cities</h2>
          <p className="text-xs text-mulberry/60">{info.cities.length} cities · shown in a list at checkout</p>
        </div>
        <Button onClick={() => setEditingId('new')}>+ Add city</Button>
      </div>

      {editingId === 'new' && (
        <CityForm onDone={() => { setEditingId(null); onChanged() }} onCancel={() => setEditingId(null)} />
      )}
      <ErrorBox message={actionError} />

      {info.cities.length > 5 && (
        <input type="search" placeholder="Search cities…" value={search} onChange={(e) => setSearch(e.target.value)}
          className={`mt-4 max-w-xs ${inputClass}`} />
      )}

      {info.cities.length === 0 ? (
        <p className="mt-6 text-sm text-mulberry/60">No cities yet. Click <b>+ Add city</b> to add your first one.</p>
      ) : (
        <ul className="mt-4 divide-y divide-gold-light/50 border-t border-gold-light/50">
          {shown.map((c) => (
            <li key={c.id} className="py-2.5">
              {editingId === c.id ? (
                <CityForm city={c} onDone={() => { setEditingId(null); onChanged() }} onCancel={() => setEditingId(null)} />
              ) : (
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex-1 font-medium">{c.name}</span>
                  <span className="w-20 text-right">{formatPrice(c.fee)}</span>
                  <button type="button" onClick={() => setEditingId(c.id)} className="text-gold hover:underline">Edit</button>
                  <button type="button" onClick={() => handleDelete(c)} className="text-mulberry/50 hover:text-red-700">Delete</button>
                </div>
              )}
            </li>
          ))}
          {shown.length === 0 && <li className="py-3 text-sm text-mulberry/60">No city matches.</li>}
        </ul>
      )}
    </Card>
  )
}

/** Add a new city, or edit one (name + price). */
function CityForm({ city, onDone, onCancel }) {
  const [name, setName] = useState(city?.name ?? '')
  const [fee, setFee] = useState(city ? String(city.fee) : '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const body = { name, fee: fee === '' ? null : Number(fee) }
    try {
      if (city) await updateDeliveryCity(city.id, body)
      else await addDeliveryCity(body)
      onDone()
    } catch (err) {
      const fields = err.response?.data?.fields
      setError(fields ? Object.values(fields)[0] : errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="mt-3 rounded-xl border border-gold bg-white p-3">
      <div className="flex flex-wrap gap-2">
        <input className={`min-w-48 flex-1 ${inputClass}`} placeholder="City / town, e.g. Jounieh" value={name}
          onChange={(e) => setName(e.target.value)} autoFocus />
        <MoneyInput value={fee} onChange={setFee} placeholder="Price" />
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
    </form>
  )
}

/** "Other cities" price + free delivery amount. */
function OtherSettings({ info, onSaved }) {
  const [otherFee, setOtherFee] = useState(String(info.otherCitiesFee ?? 0))
  const [freeOver, setFreeOver] = useState(info.freeDeliveryOver != null ? String(info.freeDeliveryOver) : '')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await updateDelivery(Number(otherFee || 0), freeOver === '' ? null : Number(freeOver))
      setMessage({ ok: true, text: '✓ Saved.' })
      onSaved()
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="h-fit">
      <h2 className="font-display text-2xl">Other settings</h2>
      <form onSubmit={handleSave} className="mt-4 space-y-4">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">
            Other cities
            <span className="block text-xs text-mulberry/50">for any city not in your list</span>
          </span>
          <MoneyInput value={otherFee} onChange={setOtherFee} />
        </label>
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm">
            Free delivery on orders of
            <span className="block text-xs text-mulberry/50">leave empty = never free</span>
          </span>
          <MoneyInput value={freeOver} onChange={setFreeOver} placeholder="e.g. 100" />
        </label>
        {message && <p className={`text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? 'Saving…' : 'Save'}</Button>
      </form>
    </Card>
  )
}

/** A "$ [ 3.00 ]" input. */
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
