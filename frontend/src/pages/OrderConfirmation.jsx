import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getOrder } from '../api/orders.js'
import WhishInstructions from '../components/WhishInstructions.jsx'
import { STORE } from '../config/store.js'
import formatPrice from '../utils/formatPrice.js'
import { paymentLabel } from '../utils/paymentMethods.js'
import { whatsappUrl } from '../utils/phone.js'
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
        <p className="mt-3 text-mulberry/70">Your order has been received.</p>
        <p className="mt-6 inline-block rounded-full border border-gold px-6 py-2 tracking-[0.2em]">{order.orderNumber}</p>
        <p className="mt-2 text-xs uppercase tracking-wider text-mulberry/60">Keep this order number</p>
      </div>

      {/* One tap: the customer sends us a ready-written WhatsApp message from their own number,
          so we see their real WhatsApp number and know the order is genuine */}
      {order.status === 'PENDING' && STORE.whatsapp && (
        <div className="mt-10 rounded-2xl border-2 border-[#25D366]/60 bg-[#25D366]/10 p-6 text-center">
          <p className="font-display text-2xl">One last step</p>
          <p className="mt-2 text-sm text-mulberry/80">
            Please confirm your order on WhatsApp - the message is already written, just press send.
          </p>
          <a href={confirmOnWhatsappUrl(order)} target="_blank" rel="noreferrer"
            className="mt-5 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-[#25D366] px-6 py-3 text-sm font-medium uppercase tracking-wider text-white sm:px-8 hover:bg-[#1ebe5b]">
            <WhatsappIcon /> Confirm on WhatsApp
          </a>
        </div>
      )}

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

/** WhatsApp link to the shop's number with the confirmation message already written. */
function confirmOnWhatsappUrl(order) {
  const message = [
    `Hi Velora, I confirm my order ${order.orderNumber} 💜`,
    `Name: ${order.customerName}`,
    `Products: ${formatPrice(order.subtotal)}`,
    `Delivery: ${order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'}`,
    `Total: ${formatPrice(order.total)}`,
  ].join('\n')
  return `${whatsappUrl(STORE.whatsapp)}?text=${encodeURIComponent(message)}`
}

function WhatsappIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.4.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6a2.7 2.7 0 0 0 1.8-1.2 2.2 2.2 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3Z" />
    </svg>
  )
}
