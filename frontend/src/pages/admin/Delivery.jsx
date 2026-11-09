import { useState } from 'react'
import { getDelivery } from '../../api/catalog.js'
import { addDeliveryCity, deleteDeliveryCity, updateDelivery, updateDeliveryCity } from '../../api/admin.js'
import { errorMessage } from '../../api/client.js'
import { inputClass } from '../../components/admin/styles.js'
import { Button, Card, ErrorBox, Loading, PageHeader } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatPrice from '../../utils/formatPrice.js'
import { REGIONS, regionLabel } from '../../utils/regions.js'

/**
 * Delivery prices:
 *  1. a default price for each AREA
 *  2. optional CITIES with their own price (they win over the area's price)
 *  3. optional free delivery above an amount
 */
export default function Delivery() {
  const { data, error, loading, reload } = useLoad(getDelivery)

  return (
    <>
      <PageHeader title="Delivery fees"
        subtitle="Customers pay the price of their city if it's in your list, otherwise their area's price" />
      <ErrorBox message={error} />
      {loading && !data && <Loading />}
      {data && (
        <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
          {/* key = refresh the form after saving */}
          <AreaPrices key={JSON.stringify(data.regions) + data.freeDeliveryOver} info={data} onSaved={reload} />
          <CityPrices info={data} onChanged={reload} />
        </div>
      )}
    </>
  )
}

/** Part 1 + 3: one price per area, and "free delivery over $X". */
function AreaPrices({ info, onSaved }) {
  const [fees, setFees] = useState(() => Object.fromEntries(info.regions.map((r) => [r.region, String(r.fee)])))
  const [freeOver, setFreeOver] = useState(info.freeDeliveryOver != null ? String(info.freeDeliveryOver) : '')
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setMessage(null)
    try {
      await updateDelivery(
        Object.keys(REGIONS).map((region) => ({ region, fee: Number(fees[region] || 0) })),
        freeOver === '' ? null : Number(freeOver),
      )
      setMessage({ ok: true, text: '✓ Saved. New orders use these prices.' })
      onSaved()
    } catch (err) {
      setMessage({ ok: false, text: errorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="h-fit">
      <h2 className="font-display text-2xl">Area prices</h2>
      <p className="text-xs text-mulberry/60">Used for any city that isn&apos;t in your city list.</p>
      <form onSubmit={handleSave} className="mt-4 space-y-2">
        {Object.entries(REGIONS).map(([key, label]) => (
          <label key={key} className="flex items-center justify-between gap-3">
            <span className="text-sm">{label}</span>
            <MoneyInput value={fees[key] ?? '0'} onChange={(v) => setFees({ ...fees, [key]: v })} />
          </label>
        ))}

        <div className="mt-5 border-t border-gold-light pt-4">
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm">
              Free delivery on orders of
              <span className="block text-xs text-mulberry/50">leave empty = never free</span>
            </span>
            <MoneyInput value={freeOver} onChange={setFreeOver} placeholder="e.g. 100" />
          </label>
        </div>

        {message && <p className={`text-sm ${message.ok ? 'text-green-800' : 'text-red-700'}`}>{message.text}</p>}
        <Button type="submit" disabled={busy} className="mt-2 w-full">{busy ? 'Saving…' : 'Save area prices'}</Button>
      </form>
    </Card>
  )
}

/** Part 2: cities with their own price. */
function CityPrices({ info, onChanged }) {
  const [editingId, setEditingId] = useState(null) // a city id, or 'new'
  const [actionError, setActionError] = useState(null)
  const areaFee = (region) => info.regions.find((r) => r.region === region)?.fee ?? 0

  async function handleDelete(city) {
    if (!window.confirm(`Remove ${city.name} from the list? It will then use the ${regionLabel(city.region)} price.`)) return
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
          <h2 className="font-display text-2xl">City prices</h2>
          <p className="text-xs text-mulberry/60">Customers choose these cities from a list at checkout.</p>
        </div>
        <Button onClick={() => setEditingId('new')}>+ Add city</Button>
      </div>

      <ErrorBox message={actionError} />
      {editingId === 'new' && (
        <CityForm onDone={() => { setEditingId(null); onChanged() }} onCancel={() => setEditingId(null)} />
      )}

      {Object.entries(REGIONS).map(([region, label]) => {
        const cities = info.cities.filter((c) => c.region === region)
        return (
          <div key={region} className="mt-5">
            <h3 className="flex items-baseline justify-between border-b border-gold-light/70 pb-1 text-sm font-medium">
              {label}
              <span className="text-xs font-normal text-mulberry/50">other cities: {formatPrice(areaFee(region))}</span>
            </h3>
            {cities.length === 0 ? (
              <p className="py-2 text-xs text-mulberry/40">No cities with their own price.</p>
            ) : (
              <ul className="divide-y divide-gold-light/40">
                {cities.map((c) => (
                  <li key={c.id} className="py-2">
                    {editingId === c.id ? (
                      <CityForm city={c} onDone={() => { setEditingId(null); onChanged() }} onCancel={() => setEditingId(null)} />
                    ) : (
                      <div className="flex items-center gap-3 text-sm">
                        <span className="flex-1">{c.name}</span>
                        <span className="w-20 text-right font-medium">{formatPrice(c.fee)}</span>
                        <button type="button" onClick={() => setEditingId(c.id)} className="text-gold hover:underline">Edit</button>
                        <button type="button" onClick={() => handleDelete(c)} className="text-mulberry/50 hover:text-red-700">Remove</button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </Card>
  )
}

/** Add a new city, or edit one. */
function CityForm({ city, onDone, onCancel }) {
  const [region, setRegion] = useState(city?.region ?? '')
  const [name, setName] = useState(city?.name ?? '')
  const [fee, setFee] = useState(city ? String(city.fee) : '')
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const body = { region: region || null, name, fee: fee === '' ? null : Number(fee) }
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
      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_110px]">
        <select className={inputClass} value={region} onChange={(e) => setRegion(e.target.value)}>
          <option value="">— area —</option>
          {Object.entries(REGIONS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
        <input className={inputClass} placeholder="City / town, e.g. Jounieh" value={name}
          onChange={(e) => setName(e.target.value)} autoFocus />
        <MoneyInput value={fee} onChange={setFee} placeholder="Price" />
      </div>
      {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
      <div className="mt-3 flex gap-2">
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
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
