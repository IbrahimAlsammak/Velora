import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createManualOrder, getAdminProducts } from '../../api/admin.js'
import { errorMessage } from '../../api/client.js'
import { inputClass } from '../../components/admin/styles.js'
import { Button, Card, ErrorBox, Field, Loading, PageHeader } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatPrice from '../../utils/formatPrice.js'
import { ORDER_SOURCES } from '../../utils/orderSources.js'
import { PAYMENT_METHODS } from '../../utils/paymentMethods.js'

const MANUAL_SOURCES = ['WHATSAPP', 'INSTAGRAM', 'OTHER']

/** Pieces in stock of this product in this colour + size. */
function piecesLeft(product, color, size) {
  if (!product) return 0
  if (!product.variants?.length) return product.stock
  const v = product.variants.find((x) => (x.color ?? '') === color && (x.size ?? '') === size)
  return v ? v.stock : 0
}

/** Can this colour still be sold? (with the chosen size, or in any size if no size chosen yet) */
function colorInStock(product, color, size) {
  if (!product.variants?.length) return product.stock > 0
  if (size || !product.sizes.length) return piecesLeft(product, color, size) > 0
  return product.variants.some((v) => v.color === color && v.stock > 0)
}

/** Can this size still be sold? (in the chosen colour, or in any colour if no colour chosen yet) */
function sizeInStock(product, size, color) {
  if (!product.variants?.length) return product.stock > 0
  if (color || !product.colors.length) return piecesLeft(product, color, size) > 0
  return product.variants.some((v) => v.size === size && v.stock > 0)
}

const emptyLine =() => ({ key: Date.now() + Math.random(), productId: '', color: '', size: '', quantity: 1, price: '' })

/**
 * Admin → Orders → "+ Manual order": a sale you made in a WhatsApp / Instagram chat.
 * It is saved as DELIVERED straight away: the pieces leave the stock and it counts in the sales report.
 */
export default function ManualOrder() {
  const { data: products, error, loading } = useLoad(getAdminProducts)
  if (loading) return <Loading />
  if (error) return <ErrorBox message={error} />
  return <Form products={[...products].sort((a, b) => a.name.localeCompare(b.name))} />
}

function Form({ products }) {
  const navigate = useNavigate()
  const [source, setSource] = useState('WHATSAPP')
  const [customer, setCustomer] = useState({ name: '', phone: '', city: '' })
  const [lines, setLines] = useState([emptyLine()])
  const [deliveryFee, setDeliveryFee] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('CASH_ON_DELIVERY')
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState(null)

  const productOf = (line) => products.find((p) => String(p.id) === String(line.productId))

  function updateLine(index, changes) {
    setLines((all) => all.map((l, i) => (i === index ? { ...l, ...changes } : l)))
  }
  function chooseProduct(index, productId) {
    const p = products.find((x) => String(x.id) === productId)
    // new product -> start again with its colour / size and its normal price
    updateLine(index, { productId, color: '', size: '', quantity: 1, price: p ? String(p.price) : '' })
  }

  const priceOf = (line) => Number(line.price || 0)
  const subtotal = lines.reduce((sum, l) => sum + (l.productId ? priceOf(l) * Number(l.quantity || 0) : 0), 0)
  const total = subtotal + Number(deliveryFee || 0)

  /** Something missing on a line? -> a short message, or null if the line is fine. */
  function lineProblem(line) {
    const p = productOf(line)
    if (!p) return 'Choose a product.'
    if (p.colors.length && !line.color) return `Choose a colour for ${p.name}.`
    if (p.sizes.length && !line.size) return `Choose a size for ${p.name}.`
    const left = piecesLeft(p, line.color, line.size)
    if (Number(line.quantity) > left) return left === 0 ? `${p.name} (this option) is sold out.` : `Only ${left} left of ${p.name} (this option).`
    return null
  }

  async function handleSave(e) {
    e.preventDefault()
    const problem = !customer.name.trim() ? "Enter the customer's name." : lines.map(lineProblem).find(Boolean)
    if (problem) {
      setFormError(problem)
      return
    }
    setBusy(true)
    setFormError(null)
    try {
      const order = await createManualOrder({
        source,
        customerName: customer.name,
        phone: customer.phone,
        city: customer.city,
        notes,
        paymentMethod,
        deliveryFee: deliveryFee === '' ? 0 : Number(deliveryFee),
        items: lines.map((l) => ({
          productId: Number(l.productId),
          color: l.color || null,
          size: l.size || null,
          quantity: Number(l.quantity),
          price: l.price === '' ? null : Number(l.price),
        })),
      })
      navigate(`/admin/orders/${order.orderNumber}`)
    } catch (err) {
      setFormError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSave}>
      <Link to="/admin/orders" className="text-sm text-gold hover:underline">← All orders</Link>
      <PageHeader title="Manual order" subtitle="A sale you made in a chat - saved as delivered, and the pieces leave the stock" />

      {/* Where it was sold */}
      <Card className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-mulberry/80">Where did you sell it?</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {MANUAL_SOURCES.map((s) => (
            <button key={s} type="button" onClick={() => setSource(s)}
              className={`rounded-full border px-5 py-2 text-sm ${
                source === s ? 'border-mulberry bg-mulberry text-cream' : 'border-gold-light hover:border-gold'
              }`}>
              {ORDER_SOURCES[s].icon} {ORDER_SOURCES[s].label}
            </button>
          ))}
        </div>
      </Card>

      {/* Customer */}
      <Card className="mb-6 grid gap-4 sm:grid-cols-3">
        <Field label="Customer name *">
          <input className={inputClass} maxLength={120} value={customer.name} placeholder="e.g. Sara K."
            onChange={(e) => setCustomer({ ...customer, name: e.target.value })} />
        </Field>
        <Field label="Phone" hint="Optional">
          <input className={inputClass} maxLength={30} inputMode="tel" value={customer.phone} placeholder="03 123 456"
            onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} />
        </Field>
        <Field label="City" hint="Optional">
          <input className={inputClass} maxLength={100} value={customer.city} placeholder="e.g. Jounieh"
            onChange={(e) => setCustomer({ ...customer, city: e.target.value })} />
        </Field>
      </Card>

      {/* Products */}
      <Card className="mb-6">
        <h2 className="font-display text-2xl">Products</h2>
        <div className="mt-4 space-y-4">
          {lines.map((line, i) => {
            const p = productOf(line)
            const ready = p && (!p.colors.length || line.color) && (!p.sizes.length || line.size)
            const left = ready ? piecesLeft(p, line.color, line.size) : null
            return (
              <div key={line.key} className="grid gap-3 rounded-xl border border-gold-light/70 p-4 sm:grid-cols-12 sm:items-end">
                <Field label="Product" className="sm:col-span-4">
                  <select className={inputClass} value={line.productId} onChange={(e) => chooseProduct(i, e.target.value)}>
                    <option value="">Choose…</option>
                    {products.map((x) => (
                      <option key={x.id} value={x.id} disabled={x.stock === 0}>
                        {x.name} {x.stock === 0 ? '(sold out)' : `(${x.stock} in stock)`}{x.active ? '' : ' - hidden'}
                      </option>
                    ))}
                  </select>
                </Field>
                {p?.colors.length > 0 && (
                  <Field label="Colour" className="sm:col-span-2">
                    <select className={inputClass} value={line.color} onChange={(e) => {
                      const color = e.target.value
                      // the chosen size is sold out in this colour -> choose the size again
                      const size = line.size && piecesLeft(p, color, line.size) === 0 ? '' : line.size
                      updateLine(i, { color, size })
                    }}>
                      <option value="">Choose…</option>
                      {p.colors.map((c) => {
                        const ok = colorInStock(p, c.name, line.size)
                        return <option key={c.name} value={c.name} disabled={!ok}>{c.name}{ok ? '' : ' (sold out)'}</option>
                      })}
                    </select>
                  </Field>
                )}
                {p?.sizes.length > 0 && (
                  <Field label="Size" className="sm:col-span-2">
                    <select className={inputClass} value={line.size} onChange={(e) => updateLine(i, { size: e.target.value })}>
                      <option value="">Choose…</option>
                      {p.sizes.map((s) => {
                        const ok = sizeInStock(p, s, line.color)
                        return <option key={s} value={s} disabled={!ok}>{s}{ok ? '' : ' (sold out)'}</option>
                      })}
                    </select>
                  </Field>
                )}
                <Field label="Qty" className="sm:col-span-1">
                  <input className={inputClass} type="number" min={1} max={100} value={line.quantity}
                    onChange={(e) => updateLine(i, { quantity: e.target.value })} />
                </Field>
                <Field label="Price each ($)" className="sm:col-span-2" hint={p && Number(line.price) !== p.price ? `Normal: ${formatPrice(p.price)}` : null}>
                  <input className={inputClass} type="number" min={0} step="0.01" value={line.price} disabled={!p}
                    onChange={(e) => updateLine(i, { price: e.target.value })} />
                </Field>
                <div className="flex items-center justify-between gap-3 text-sm sm:col-span-12">
                  <span className={left === 0 || (left !== null && Number(line.quantity) > left) ? 'text-red-700' : 'text-mulberry/60'}>
                    {left === null ? '' : left === 0 ? 'Sold out' : `${left} in stock`}
                  </span>
                  {/* the price of this line: quantity x price each */}
                  {p && (
                    <span className="ml-auto">
                      {Number(line.quantity) > 1 && <span className="text-mulberry/60">{line.quantity} × {formatPrice(priceOf(line))} = </span>}
                      <strong>{formatPrice(priceOf(line) * Number(line.quantity || 0))}</strong>
                    </span>
                  )}
                  {lines.length > 1 && (
                    <button type="button" onClick={() => setLines(lines.filter((_, j) => j !== i))}
                      className="text-red-700 hover:underline">Remove</button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <Button type="button" variant="secondary" className="mt-4" onClick={() => setLines([...lines, emptyLine()])}>
          + Add another product
        </Button>
      </Card>

      {/* Money */}
      <Card className="mb-6 grid gap-4 sm:grid-cols-3">
        <Field label="Delivery fee ($)" hint="0 or empty if there was no delivery">
          <input className={inputClass} type="number" min={0} step="0.01" value={deliveryFee} placeholder="0"
            onChange={(e) => setDeliveryFee(e.target.value)} />
        </Field>
        <Field label="Paid by">
          <select className={inputClass} value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {Object.entries(PAYMENT_METHODS).map(([key, m]) => <option key={key} value={key}>{key === 'CASH_ON_DELIVERY' ? 'Cash' : m.label}</option>)}
          </select>
        </Field>
        <Field label="Note" hint="Optional, only you see it">
          <input className={inputClass} maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>
      </Card>

      <ErrorBox message={formError} />
      <Card className="flex flex-wrap items-center gap-4">
        <p className="mr-auto text-lg">
          Total: <strong>{formatPrice(total)}</strong>
          {Number(deliveryFee) > 0 && <span className="ml-2 text-sm text-mulberry/60">({formatPrice(subtotal)} + {formatPrice(Number(deliveryFee))} delivery)</span>}
        </p>
        <Button type="submit" disabled={busy}>{busy ? 'Saving…' : '✓ Save as delivered'}</Button>
      </Card>
    </form>
  )
}
