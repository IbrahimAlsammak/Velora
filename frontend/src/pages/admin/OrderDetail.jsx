import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { changeOrderStatus, deleteOrder, getAdminOrder } from '../../api/admin.js'
import { errorMessage } from '../../api/client.js'
import { Button, Card, ErrorBox, Loading, PageHeader, StatusBadge } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatDate from '../../utils/formatDate.js'
import formatPrice from '../../utils/formatPrice.js'
import { paymentLabel } from '../../utils/paymentMethods.js'
import { callUrl, formatPhone, whatsappUrl } from '../../utils/phone.js'
import { regionLabel } from '../../utils/regions.js'

/**
 * The usual next step for each status, shown as the big button.
 * Whish: pending -> paid (money received) -> shipped -> delivered
 * Cash on delivery: pending -> shipped -> delivered (the cash is collected at the door)
 */
const NEXT_STEP = {
  WHISH_TRANSFER: {
    PENDING: { status: 'PAID', label: 'Whish payment received' },
    PAID: { status: 'SHIPPED', label: 'Mark as shipped' },
    SHIPPED: { status: 'DELIVERED', label: 'Mark as delivered' },
  },
  CASH_ON_DELIVERY: {
    PENDING: { status: 'SHIPPED', label: 'Confirm & mark as shipped' },
    PAID: { status: 'SHIPPED', label: 'Mark as shipped' },
    SHIPPED: { status: 'DELIVERED', label: 'Delivered & cash collected' },
  },
}

export default function OrderDetail() {
  const { orderNumber } = useParams()
  const navigate = useNavigate()
  const { data, error, loading } = useLoad(() => getAdminOrder(orderNumber), [orderNumber])
  const [updated, setUpdated] = useState(null) // the order after a status change
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  const order = updated?.orderNumber === orderNumber ? updated : data

  async function setStatus(status, isReturn = false) {
    const question = isReturn
      ? 'Did the customer send the items back? The order will be marked as cancelled and the items ' +
        'put back into stock. Remember to refund the customer. This cannot be undone.'
      : 'Cancel this order? The items will be put back into stock. This cannot be undone.'
    if (status === 'CANCELLED' && !window.confirm(question)) {
      return
    }
    setBusy(true)
    setActionError(null)
    try {
      setUpdated(await changeOrderStatus(orderNumber, status))
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete order ${orderNumber} for good? This cannot be undone.`)) return
    setBusy(true)
    setActionError(null)
    try {
      await deleteOrder(orderNumber)
      navigate('/admin/orders')
    } catch (err) {
      setActionError(errorMessage(err))
      setBusy(false)
    }
  }

  if (loading && !order) return <Loading />
  if (error && !order) return <ErrorBox message={error} />
  if (!order) return null

  const next = NEXT_STEP[order.paymentMethod]?.[order.status]

  return (
    <>
      <Link to="/admin/orders" className="text-sm text-gold hover:underline">← All orders</Link>
      <PageHeader title={order.orderNumber} subtitle={`Placed ${formatDate(order.createdAt)}`}>
        <StatusBadge status={order.status} />
      </PageHeader>

      {/* How the customer pays */}
      <Card className="mb-6 text-sm">
        <span className="text-mulberry/60">Payment: </span>
        <strong>{paymentLabel(order.paymentMethod)}</strong>
        {order.paymentMethod === 'WHISH_TRANSFER' && order.status === 'PENDING' && (
          <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
            Check your Whish app for <strong>{formatPrice(order.total)}</strong> with the note{' '}
            <strong>{order.orderNumber}</strong>. When it&apos;s there, click &quot;Whish payment received&quot;.
          </p>
        )}
        {order.paymentMethod === 'CASH_ON_DELIVERY' && order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
          <p className="mt-2 text-mulberry/70">
            The delivery person collects <strong>{formatPrice(order.total)}</strong> in cash.
          </p>
        )}
      </Card>

      {/* Status actions */}
      {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
        <Card className="mb-6 flex flex-wrap items-center gap-3">
          <span className="mr-auto text-sm text-mulberry/70">Update this order:</span>
          {next && <Button disabled={busy} onClick={() => setStatus(next.status)}>{next.label}</Button>}
          <Button variant="danger" disabled={busy} onClick={() => setStatus('CANCELLED')}>Cancel order</Button>
        </Card>
      )}
      {order.status === 'DELIVERED' && (
        <Card className="mb-6 flex flex-wrap items-center gap-3">
          <span className="mr-auto text-sm text-green-800">✓ This order is complete.</span>
          {/* For returns: cancels the order and puts the items back into stock */}
          <Button variant="danger" disabled={busy} onClick={() => setStatus('CANCELLED', true)}>
            Customer returned it
          </Button>
        </Card>
      )}
      {order.status === 'CANCELLED' && (
        <Card className="mb-6 flex flex-wrap items-center gap-3">
          <span className="mr-auto text-sm text-mulberry/70">
            This order is cancelled. You can delete it if it was a test or mistake.
          </span>
          <Button variant="danger" disabled={busy} onClick={handleDelete}>Delete order</Button>
        </Card>
      )}
      <ErrorBox message={actionError} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl">Customer</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <Row label="Name">{order.customerName}</Row>
            <Row label="Phone"><span className="font-medium">{formatPhone(order.phone)}</span></Row>
            {/* Older orders were placed with an email */}
            {order.email && <Row label="Email">{order.email}</Row>}
          </dl>
          {/* Contact the customer with one click */}
          <div className="mt-4 flex flex-wrap gap-2">
            <a href={whatsappUrl(order.phone)} target="_blank" rel="noreferrer"
              className="rounded-full bg-mulberry px-5 py-2 text-sm tracking-wider text-cream hover:bg-gold">
              WhatsApp
            </a>
            <a href={callUrl(order.phone)}
              className="rounded-full border border-gold-light px-5 py-2 text-sm tracking-wider hover:border-gold hover:text-gold">
              Call
            </a>
          </div>
        </Card>
        <Card>
          <h2 className="font-display text-2xl">Delivery address</h2>
          <address className="mt-3 text-sm not-italic leading-relaxed">
            {order.addressLine}<br />
            {[order.building && `Building: ${order.building}`, order.floor && `Floor: ${order.floor}`].filter(Boolean).join(' · ')}
            {(order.building || order.floor) && <br />}
            {order.city}{order.postalCode ? ` ${order.postalCode}` : ''}<br />
            {order.region ? `${regionLabel(order.region)}, ` : ''}{order.country}
          </address>
          {order.landmark && (
            <p className="mt-3 text-sm"><span className="text-mulberry/60">Landmark:</span> {order.landmark}</p>
          )}
          {order.notes && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm"><strong>Note:</strong> {order.notes}</p>
          )}
        </Card>
      </div>

      <Card className="mt-6 overflow-x-auto">
        <h2 className="font-display text-2xl">Items</h2>
        <table className="mt-3 w-full min-w-[480px] text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-mulberry/60">
            <tr>
              <th className="py-2">Product</th><th className="py-2">Options</th>
              <th className="py-2 text-center">Qty</th><th className="py-2 text-right">Price</th><th className="py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gold-light/50">
            {order.items.map((i, index) => (
              <tr key={index}>
                <td className="py-2.5 font-medium">{i.productName}</td>
                <td className="py-2.5 text-mulberry/70">{[i.color, i.size].filter(Boolean).join(' · ') || '—'}</td>
                <td className="py-2.5 text-center">{i.quantity}</td>
                <td className="py-2.5 text-right">{formatPrice(i.unitPrice)}</td>
                <td className="py-2.5 text-right">{formatPrice(i.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="ml-auto mt-4 max-w-xs space-y-1 border-t border-gold-light pt-3 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Shipping</dt><dd>{order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'}</dd></div>
          <div className="flex justify-between text-base font-medium"><dt>Total</dt><dd>{formatPrice(order.total)}</dd></div>
        </dl>
      </Card>
    </>
  )
}

function Row({ label, children }) {
  return (
    <div className="flex gap-3">
      <dt className="w-16 shrink-0 text-mulberry/60">{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}
