import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrder } from '../api/orders.js'
import WhishInstructions from '../components/WhishInstructions.jsx'
import { STORE } from '../config/store.js'
import formatPrice from '../utils/formatPrice.js'
import { paymentLabel } from '../utils/paymentMethods.js'
import { formatPhone } from '../utils/phone.js'
import { placeLabel } from '../utils/regions.js'

export default function OrderConfirmation() {
  const { orderNumber } = useParams()
  const [state, setState] = useState({ number: null, order: null, error: false })

  useEffect(() => {
    let cancelled = false
    getOrder(orderNumber)
      .then((order) => !cancelled && setState({ number: orderNumber, order, error: false }))
      .catch(() => !cancelled && setState({ number: orderNumber, order: null, error: true }))
    return () => {
      cancelled = true
    }
  }, [orderNumber])

  if (state.number !== orderNumber) return <p className="py-24 text-center text-gold">Loading…</p>
  if (state.error) {
    return (
      <section className="py-24 text-center">
        <h1 className="font-display text-4xl">Order not found</h1>
        <Link to="/shop" className="mt-6 inline-block text-gold underline">Back to the shop</Link>
      </section>
    )
  }

  const { order } = state
  return (
    <section className="mx-auto max-w-2xl px-4 py-16">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-mulberry text-2xl text-cream">✓</div>
        <h1 className="mt-6 font-display text-4xl md:text-5xl font-semibold">Thank you, {order.customerName.split(' ')[0]}!</h1>
        <p className="mt-3 text-mulberry/70">Your order has been received. We&apos;ll call or WhatsApp you on {formatPhone(order.phone)} to confirm it.</p>
        <p className="mt-6 inline-block rounded-full border border-gold px-6 py-2 tracking-[0.2em]">{order.orderNumber}</p>
        <p className="mt-2 text-xs uppercase tracking-wider text-mulberry/60">Keep this order number</p>
      </div>

      {/* Whish transfer, not paid yet -> show how to pay */}
      {order.paymentMethod === 'WHISH_TRANSFER' && order.status === 'PENDING' && STORE.whishNumber && (
        <div className="mt-10">
          <WhishInstructions amount={order.total} orderNumber={order.orderNumber} />
        </div>
      )}

      <div className="mt-12 rounded-2xl border border-gold-light bg-white/60 p-6">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span>Status: <strong className="text-gold">{order.status.toLowerCase()}</strong></span>
          <span>Payment: {paymentLabel(order.paymentMethod)}</span>
          <span>Delivering to {placeLabel(order)}</span>
        </div>
        <ul className="mt-5 space-y-3 border-t border-gold-light pt-5 text-sm">
          {order.items.map((i, index) => (
            <li key={index} className="flex justify-between gap-3">
              <span>
                {i.quantity} × {i.productName}
                <span className="block text-mulberry/60">{[i.color, i.size].filter(Boolean).join(' · ')}</span>
              </span>
              <span className="shrink-0">{formatPrice(i.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-5 space-y-2 border-t border-gold-light pt-5 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'}</dd></div>
          <div className="flex justify-between border-t border-gold-light pt-3 text-lg font-medium"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </div>

      <div className="mt-10 text-center">
        <Link to="/shop" className="inline-block rounded-full bg-mulberry px-10 py-3 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold">
          Continue shopping
        </Link>
      </div>
    </section>
  )
}
