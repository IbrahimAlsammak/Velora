import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getDelivery } from '../api/catalog.js'
import CityPicker from '../components/CityPicker.jsx'
import { placeOrder } from '../api/orders.js'
import { useAuth } from '../context/useAuth.js'
import { useCart } from '../context/useCart.js'
import useLoad from '../hooks/useLoad.js'
import formatPrice from '../utils/formatPrice.js'
import { availablePaymentMethods, PAYMENT_METHODS } from '../utils/paymentMethods.js'
import { formatPhone } from '../utils/phone.js'

const EMPTY_FORM = {
  customerName: '',
  phone: '',
  city: '',
  addressLine: '',
  building: '',
  floor: '',
  landmark: '',
  notes: '',
  paymentMethod: 'CASH_ON_DELIVERY', // chosen by default
}

export default function Checkout() {
  const { items, subtotal, clear } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  // Logged in? Start with their name and phone already filled in.
  const [form, setForm] = useState(() =>
    user ? { ...EMPTY_FORM, customerName: user.fullName, phone: user.phone ? formatPhone(user.phone) : '' } : EMPTY_FORM,
  )
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { data: delivery } = useLoad(getDelivery) // delivery prices set in the admin panel

  // Nothing to buy -> send them back to the bag
  if (items.length === 0 && !submitting) return <Navigate to="/cart" replace />

  const update = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  // ----- Delivery price (shown here; the backend calculates the real one) -----
  const cities = delivery?.cities ?? []
  const typed = form.city.trim().toLowerCase()
  const chosenCity = cities.find((c) => c.name.toLowerCase() === typed) // undefined = a city that's not in the list
  const otherFee = Number(delivery?.otherCitiesFee ?? 0)
  const freeOver = delivery?.freeDeliveryOver != null ? Number(delivery.freeDeliveryOver) : null
  const isFree = freeOver != null && subtotal >= freeOver
  const deliveryFee = !typed ? null : isFree ? 0 : chosenCity ? Number(chosenCity.fee) : otherFee

  async function handleSubmit(e) {
    e.preventDefault() // stop the browser reloading the page
    setSubmitting(true)
    setError(null)
    setFieldErrors({})
    try {
      // Only IDs, options and quantities are sent - the backend works out the prices itself
      const order = await placeOrder({
        ...form,
        cityId: chosenCity ? chosenCity.id : null, // null = "other city" -> the "other cities" price
        items: items.map((i) => ({ productId: i.productId, color: i.color, size: i.size, quantity: i.quantity })),
      })
      navigate(`/order/${order.orderNumber}`, { replace: true })
      clear()
    } catch (err) {
      const data = err.response?.data
      setFieldErrors(data?.fields ?? {})
      setError(data?.message ?? 'Could not place your order. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl md:text-5xl font-semibold">Checkout</h1>
      {user ? (
        <p className="mt-2 text-sm text-mulberry/70">
          Logged in as <strong>{user.fullName}</strong> - this order will be saved to your account.
        </p>
      ) : (
        <p className="mt-2 text-sm text-mulberry/70">
          Have an account?{' '}
          <Link to="/login" state={{ from: '/checkout' }} className="text-gold underline">Log in</Link>
          {' '}to track your order. Or just continue as a guest.
        </p>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        {/* Left: customer details */}
        <div>
          <h2 className="font-display text-2xl">Contact</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" value={form.customerName} onChange={update('customerName')} error={fieldErrors.customerName} autoComplete="name" className="sm:col-span-2" />
            <Field label="Phone (we'll call or WhatsApp you)" type="tel" placeholder="e.g. 03 123 456" value={form.phone} onChange={update('phone')} error={fieldErrors.phone} autoComplete="tel" />
          </div>

          <h2 className="mt-10 font-display text-2xl">Delivery address</h2>
          <p className="mt-1 text-sm text-mulberry/60">
            We deliver all over Lebanon.
            {freeOver != null && <> Free delivery on orders of {formatPrice(freeOver)} or more.</>}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {/* City: type to search the store's list - each city shows its delivery price */}
            <CityPicker cities={cities} otherFee={otherFee} value={form.city} error={fieldErrors.city}
              onChange={(city) => setForm({ ...form, city })} className="sm:col-span-2" />
            <Field label="Street" value={form.addressLine} onChange={update('addressLine')} error={fieldErrors.addressLine} autoComplete="address-line1" className="sm:col-span-2" />
            <Field label="Building (optional)" placeholder="Name or number" value={form.building} onChange={update('building')} error={fieldErrors.building} />
            <Field label="Floor (optional)" placeholder="e.g. 3rd floor" value={form.floor} onChange={update('floor')} error={fieldErrors.floor} />
            <Field label="Nearby landmark (optional)" placeholder="e.g. next to Spinneys" value={form.landmark} onChange={update('landmark')} error={fieldErrors.landmark} className="sm:col-span-2" />
            <label className="sm:col-span-2 block">
              <span className="text-sm uppercase tracking-wider">Order notes (optional)</span>
              <textarea rows={3} value={form.notes} onChange={update('notes')} maxLength={500}
                className="mt-1 w-full rounded-xl border border-gold-light bg-white/70 px-4 py-3 outline-none focus:border-gold" />
            </label>
          </div>

          <h2 className="mt-10 font-display text-2xl">Payment</h2>
          <div className="mt-4 space-y-3">
            {availablePaymentMethods().map((key) => {
              const method = PAYMENT_METHODS[key]
              const selected = form.paymentMethod === key
              return (
                <label key={key}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                    selected ? 'border-mulberry bg-white' : 'border-gold-light bg-white/50 hover:border-gold'
                  }`}>
                  <input type="radio" name="paymentMethod" value={key} checked={selected}
                    onChange={update('paymentMethod')} className="mt-1 accent-mulberry" />
                  <span>
                    <span className="font-medium">{method.label}</span>
                    <span className="block text-sm text-mulberry/70">{method.description}</span>
                  </span>
                </label>
              )
            })}
          </div>
          {fieldErrors.paymentMethod && <p className="mt-2 text-sm text-red-700">{fieldErrors.paymentMethod}</p>}
        </div>

        {/* Right: order summary */}
        <aside className="h-fit rounded-2xl border border-gold-light bg-white/60 p-6">
          <h2 className="font-display text-2xl">Your order</h2>
          <ul className="mt-4 space-y-3 text-sm">
            {items.map((i) => (
              <li key={i.key} className="flex justify-between gap-3">
                <span>
                  {i.quantity} × {i.name}
                  <span className="block text-mulberry/60">{[i.color, i.size].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="shrink-0">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t border-gold-light pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{deliveryFee == null ? <span className="text-mulberry/50">choose your city</span> : deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</dd>
            </div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-gold-light pt-4 text-lg font-medium">
            <span>Total</span><span>{formatPrice(subtotal + (deliveryFee ?? 0))}</span>
          </div>
          {freeOver != null && !isFree && (
            <p className="mt-2 text-xs text-mulberry/60">Add {formatPrice(freeOver - subtotal)} more for free delivery.</p>
          )}

          {error && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <button type="submit" disabled={submitting}
            className="mt-6 w-full rounded-full bg-mulberry py-3.5 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold disabled:opacity-50">
            {submitting ? 'Placing order…' : 'Place order'}
          </button>
          <Link to="/cart" className="mt-3 block text-center text-sm text-gold underline">Back to bag</Link>
        </aside>
      </form>
    </section>
  )
}

/** One labelled input box with its error message underneath. */
function Field({ label, error, className = '', ...inputProps }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-sm uppercase tracking-wider">{label}</span>
      <input
        {...inputProps}
        className={`mt-1 w-full rounded-xl border bg-white/70 px-4 py-3 outline-none focus:border-gold ${
          error ? 'border-red-400' : 'border-gold-light'
        }`}
      />
      {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  )
}
