import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getOrders } from '../../api/admin.js'
import { Card, ErrorBox, Loading, PageHeader, StatusBadge } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatDate from '../../utils/formatDate.js'
import formatPrice from '../../utils/formatPrice.js'
import { placeLabel } from '../../utils/regions.js'

const FILTERS = ['', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED']

export default function Orders() {
  const [searchParams, setSearchParams] = useSearchParams()
  const status = searchParams.get('status') || ''
  const { data: orders, error, loading } = useLoad(() => getOrders(status), [status])
  const navigate = useNavigate()

  return (
    <>
      <PageHeader title="Orders" subtitle="Click an order to see the customer's details and change its status" />

      <div className="mb-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f || 'all'} type="button" onClick={() => setSearchParams(f ? { status: f } : {})}
            className={`rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider ${
              status === f ? 'border-mulberry bg-mulberry text-cream' : 'border-gold-light hover:border-gold'
            }`}>
            {f ? f.toLowerCase() : 'All'}
          </button>
        ))}
      </div>

      <ErrorBox message={error} />
      {loading && <Loading />}

      {!loading && orders && (
        <Card className="overflow-x-auto p-0">
          {orders.length === 0 ? (
            <p className="p-6 text-sm text-mulberry/60">No orders here.</p>
          ) : (
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="border-b border-gold-light/70 text-xs uppercase tracking-wider text-mulberry/60">
                <tr>
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Date</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Deliver to</th>
                  <th className="px-5 py-3 text-center">Items</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Payment</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-light/50">
                {orders.map((o) => (
                  <tr key={o.orderNumber} onClick={() => navigate(`/admin/orders/${o.orderNumber}`)}
                    className="cursor-pointer hover:bg-gold-light/15">
                    <td className="px-5 py-3 font-medium">
                      <Link to={`/admin/orders/${o.orderNumber}`} className="hover:text-gold">{o.orderNumber}</Link>
                    </td>
                    <td className="px-5 py-3 text-mulberry/70">{formatDate(o.createdAt)}</td>
                    <td className="px-5 py-3">{o.customerName}</td>
                    <td className="px-5 py-3 text-mulberry/70">{placeLabel(o)}</td>
                    <td className="px-5 py-3 text-center">{o.itemCount}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatPrice(o.total)}</td>
                    <td className="px-5 py-3 text-mulberry/70">{o.paymentMethod === 'WHISH_TRANSFER' ? 'Whish' : 'Cash'}</td>
                    <td className="px-5 py-3"><StatusBadge status={o.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      )}
    </>
  )
}
