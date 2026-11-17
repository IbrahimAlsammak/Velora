import { useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { changeDeliveryFee, changeOrderStatus, deleteOrder, getAdminOrder } from '../../api/admin.js'
import { errorMessage } from '../../api/client.js'
import { Button, Card, ErrorBox, Loading, PageHeader, StatusBadge } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatDate from '../../utils/formatDate.js'
import formatPrice from '../../utils/formatPrice.js'
import { paymentLabel } from '../../utils/paymentMethods.js'
import { callUrl, formatPhone, whatsappUrl } from '../../utils/phone.js'
import { ORDER_SOURCES, isManual } from '../../utils/orderSources.js'
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

/**
 * "Undo" - one step back, for when a button was pressed by mistake
 * (e.g. marked as delivered too early -> it also leaves the sales report again).
 */
const PREVIOUS_STEP = {
  WHISH_TRANSFER: {
    PAID: { status: 'PENDING', label: 'Not paid yet' },
    SHIPPED: { status: 'PAID', label: 'Not shipped yet' },
    DELIVERED: { status: 'SHIPPED', label: 'Not delivered yet' },
  },
  CASH_ON_DELIVERY: {
    PAID: { status: 'PENDING', label: 'Not confirmed yet' },
    SHIPPED: { status: 'PENDING', label: 'Not shipped yet' },
    DELIVERED: { status: 'SHIPPED', label: 'Not delivered yet' },
  },
}

export default function OrderDetail() {
  const { orderNumber } = useParams()
  const navigate = useNavigate()
  const { data, error, loading } = useLoad(() => getAdminOrder(orderNumber), [orderNumber])
  const { refreshPending } = useOutletContext() ?? {} // updates the red number straight away
  const [updated, setUpdated] = useState(null) // the order after a status change
  const [busy, setBusy] = useState(false)
  const [actionError, setActionError] = useState(null)

  const order = updated?.orderNumber === orderNumber ? updated : data

  async function setStatus(status, isReturn = false) {
    const question = isReturn && isManual(order)
      ? 'Cancel this sale? Use this if you entered it by mistake or the customer gave the items back. ' +
        'The items go back into stock and it leaves the sales report. This cannot be undone.'
      : isReturn
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
      refreshPending?.()
    } catch (err) {
      setActionError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(keepStock = false) {
    const question = keepStock
      ? `Delete order ${orderNumber}? Only this order is removed: the stock stays as it is ` +
        '(the pieces stay sold), and it leaves the sales report. ' +
        'If you entered it by mistake and want the pieces back in stock, press "Cancel this sale" instead. This cannot be undone.'
      : `Delete order ${orderNumber} for good? This cannot be undone.`
    if (!window.confirm(question)) return
    setBusy(true)
    setActionError(null)
    try {
      await deleteOrder(orderNumber)
      refreshPending?.()
      navigate('/admin/orders')
    } catch (err) {
      setActionError(errorMessage(err))
      setBusy(false)
    }
  }

  if (loading && !order) return <Loading />
  if (error && !order) return <ErrorBox message={error} />
  if (!order) return null

  const manual = isManual(order) // a sale you entered yourself (WhatsApp / Instagram)
  const soldOn = ORDER_SOURCES[order.source]?.label ?? order.source
  const next = NEXT_STEP[order.paymentMethod]?.[order.status]
  // manual sales are simply "delivered" - no steps to go back to
  const previous = manual ? null : PREVIOUS_STEP[order.paymentMethod]?.[order.status]
  const undoButton = previous && (
    <Button variant="secondary" disabled={busy} onClick={() => setStatus(previous.status)}
      title="Pressed by mistake? Go one step back">
      ↩ Undo: {previous.label}
    </Button>
  )

  return (
    <>
      <Link to="/admin/orders" className="text-sm text-gold hover:underline">← All orders</Link>
      <PageHeader title={order.orderNumber}
        subtitle={manual ? `${ORDER_SOURCES[order.source]?.icon ?? ''} Manual order - sold on ${soldOn}, entered ${formatDate(order.createdAt)}` : `Placed ${formatDate(order.createdAt)}`}>
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
          {undoButton}
          {next && <Button disabled={busy} onClick={() => setStatus(next.status)}>{next.label}</Button>}
          <Button variant="danger" disabled={busy} onClick={() => setStatus('CANCELLED')}>Cancel order</Button>
        </Card>
      )}
      {order.status === 'DELIVERED' && manual && (
        <Card className="mb-6 flex flex-wrap items-center gap-3">
          <span className="mr-auto text-sm text-green-800">✓ Sold on {soldOn} - counted in your sales report.</span>
          {/* Entered by mistake, or the customer gave it back: pieces go back into stock */}
          <Button variant="danger" disabled={busy} onClick={() => setStatus('CANCELLED', true)}
            title="The pieces go back into stock">
            Cancel this sale
          </Button>
          {/* Just remove the record: the pieces stay sold */}
          <Button variant="danger" disabled={busy} onClick={() => handleDelete(true)}
            title="Removes only this order - the stock stays as it is">
            Delete (keep stock)
          </Button>
        </Card>
      )}
      {order.status === 'DELIVERED' && !manual && (
        <Card className="mb-6 flex flex-wrap items-center gap-3">
          <span className="mr-auto text-sm text-green-800">✓ This order is complete.</span>
          {undoButton}
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
          <Button variant="danger" disabled={busy} onClick={() => handleDelete()}>Delete order</Button>
        </Card>
      )}
      <ErrorBox message={actionError} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-display text-2xl">Customer</h2>
          <dl className="mt-3 space-y-1 text-sm">
            <Row label="Name">{order.customerName}</Row>
            <Row label="Phone">{order.phone ? <span className="font-medium">{formatPhone(order.phone)}</span> : '—'}</Row>
            {/* Older orders were placed with an email */}
            {order.email && <Row label="Email">{order.email}</Row>}
          </dl>
          {/* Contact the customer with one click */}
          {order.phone && <div className="mt-4 flex flex-wrap gap-2">
            <a href={whatsappUrl(order.phone)} target="_blank" rel="noreferrer"
              className="rounded-full bg-mulberry px-5 py-2 text-sm tracking-wider text-cream hover:bg-gold">
              WhatsApp
            </a>
            <a href={callUrl(order.phone)}
              className="rounded-full border border-gold-light px-5 py-2 text-sm tracking-wider hover:border-gold hover:text-gold">
              Call
            </a>
          </div>}
        </Card>
        <Card>
          <h2 className="font-display text-2xl">{manual ? 'City' : 'Delivery address'}</h2>
          {manual ? (
            <p className="mt-3 text-sm">{order.city || '—'}</p>
          ) : <address className="mt-3 text-sm not-italic leading-relaxed">
            {order.addressLine}<br />
            {[order.building && `Building: ${order.building}`, order.floor && `Floor: ${order.floor}`].filter(Boolean).join(' · ')}
            {(order.building || order.floor) && <br />}
            {order.city}{order.postalCode ? ` ${order.postalCode}` : ''}<br />
            {order.region ? `${regionLabel(order.region)}, ` : ''}{order.country}
          </address>}
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
          <div className="flex justify-between"><dt>Products</dt><dd>{formatPrice(order.subtotal)}</dd></div>
          <DeliveryRow order={order} onSaved={setUpdated} />
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

/**
 * The delivery line, with "Edit" to change the fee of this order only.
 * Example: the customer orders again and you deliver both together -> set this one to 0.
 */
function DeliveryRow({ order, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [fee, setFee] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  function start() {
    setFee(String(order.shippingCost))
    setError(null)
    setEditing(true)
  }

  async function save() {
    if (fee === '' || Number(fee) < 0) {
      setError('Enter an amount (0 for free).')
      return
    }
    setBusy(true)
    setError(null)
    try {
      onSaved(await changeDeliveryFee(order.orderNumber, Number(fee)))
      setEditing(false)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (!editing) {
    return (
      <div className="flex justify-between gap-3">
        <dt>
          Delivery
          {order.status !== 'CANCELLED' && (
            <button type="button" onClick={start} className="ml-2 text-xs text-gold hover:underline">Edit</button>
          )}
        </dt>
        <dd>{order.shippingCost > 0 ? formatPrice(order.shippingCost) : 'Free'}</dd>
      </div>
    )
  }
  return (
    <div className="rounded-lg bg-gold-light/20 p-3">
      <label className="block text-xs text-mulberry/70">
        Delivery fee for this order ($)
        <input type="number" min={0} step="0.01" value={fee} autoFocus onChange={(e) => setFee(e.target.value)}
          className="mt-1 w-full rounded-lg border border-gold-light bg-white px-3 py-1.5 outline-none focus:border-gold" />
      </label>
      <p className="mt-1 text-xs text-mulberry/60">One delivery for several orders? Put 0 on the extra ones.</p>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
      <div className="mt-2 flex gap-2">
        <Button disabled={busy} onClick={save}>{busy ? 'Saving…' : 'Save'}</Button>
        <Button variant="secondary" disabled={busy} onClick={() => setEditing(false)}>Cancel</Button>
      </div>
    </div>
  )
}
