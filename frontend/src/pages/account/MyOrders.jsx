import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getMyOrders } from '../../api/account.js'
import OrderCard from '../../components/account/OrderCard.jsx'
import useLoad from '../../hooks/useLoad.js'
import { isActiveOrder } from '../../utils/orderStatus.js'

// The filter buttons above the list
const FILTERS = [
  { key: 'all', label: 'All', test: () => true },
  { key: 'active', label: 'In progress', test: isActiveOrder },
  { key: 'delivered', label: 'Delivered', test: (o) => o.status === 'DELIVERED' },
  { key: 'cancelled', label: 'Cancelled', test: (o) => o.status === 'CANCELLED' },
]

/** All the customer's orders, newest first, with filters. */
export default function MyOrders() {
  const { data: orders, error, loading } = useLoad(getMyOrders)
  const [filter, setFilter] = useState('all')

  const list = orders ?? []
  const shown = list.filter(FILTERS.find((f) => f.key === filter).test)

  return (
    <div>
      <h2 className="font-display text-3xl">My orders</h2>
      <p className="mt-1 text-sm text-mulberry/60">Click an order to see its items, address and payment.</p>

      {list.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {FILTERS.map((f) => {
            const count = list.filter(f.test).length
            return (
              <button key={f.key} type="button" onClick={() => setFilter(f.key)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  filter === f.key ? 'border-mulberry bg-mulberry text-cream' : 'border-gold-light hover:border-gold'
                }`}>
                {f.label} <span className="opacity-60">({count})</span>
              </button>
            )
          })}
        </div>
      )}

      <div className="mt-6 space-y-4">
        {error && <p className="text-sm text-red-700">{error}</p>}
        {loading && !orders && <p className="text-gold">Loading…</p>}
        {orders && list.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gold-light p-8 text-center">
            <p className="text-mulberry/70">No orders yet.</p>
            <Link to="/shop" className="mt-4 inline-block rounded-full bg-mulberry px-8 py-3 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold">
              Start shopping
            </Link>
          </div>
        )}
        {list.length > 0 && shown.length === 0 && (
          <p className="text-sm text-mulberry/60">No orders here.</p>
        )}
        {shown.map((o) => <OrderCard key={o.orderNumber} order={o} />)}
      </div>
    </div>
  )
}
