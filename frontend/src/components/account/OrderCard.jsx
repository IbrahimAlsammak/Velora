import { Link } from 'react-router-dom'
import formatDate from '../../utils/formatDate.js'
import formatPrice from '../../utils/formatPrice.js'
import { ORDER_STATUS, ORDER_STEPS } from '../../utils/orderStatus.js'

/** A coloured label like "On its way". */
export function StatusBadge({ status }) {
  const s = ORDER_STATUS[status] ?? { label: status, tone: 'bg-gray-50 text-gray-600 border-gray-200' }
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-3 py-0.5 text-xs font-medium ${s.tone}`}>
      {s.label}
    </span>
  )
}

/** Received -> Confirmed -> On its way -> Delivered, with the reached steps filled in. */
export function OrderProgress({ status }) {
  const step = ORDER_STATUS[status]?.step ?? 0
  if (step < 0) return null // cancelled orders have no progress
  return (
    <ol className="grid grid-cols-4 gap-1.5">
      {ORDER_STEPS.map((label, i) => (
        <li key={label}>
          <span className={`block h-1.5 rounded-full ${i <= step ? 'bg-gold' : 'bg-gold-light/40'}`} />
          <span className={`mt-1.5 block text-[11px] uppercase tracking-wider ${i <= step ? 'text-mulberry' : 'text-mulberry/40'}`}>
            {label}
          </span>
        </li>
      ))}
    </ol>
  )
}

/** One order in the customer's list - click to open it. */
export default function OrderCard({ order, showProgress = true }) {
  return (
    <Link to={`/order/${order.orderNumber}`}
      className="block rounded-2xl border border-gold-light bg-white/70 p-5 transition hover:border-gold hover:shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-medium tracking-wider">{order.orderNumber}</p>
          <p className="mt-0.5 text-sm text-mulberry/60">
            {formatDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
            {order.city && <> · {order.city}</>}
          </p>
        </div>
        <div className="text-right">
          <StatusBadge status={order.status} />
          <p className="mt-1 font-display text-2xl">{formatPrice(order.total)}</p>
        </div>
      </div>
      {showProgress && order.status !== 'CANCELLED' && (
        <div className="mt-4"><OrderProgress status={order.status} /></div>
      )}
      <p className="mt-4 text-xs uppercase tracking-wider text-gold">View order →</p>
    </Link>
  )
}
