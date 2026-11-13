import { Link } from 'react-router-dom'
import { getDashboard } from '../../api/admin.js'
import { Card, ErrorBox, Loading, PageHeader, StatusBadge } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatDate from '../../utils/formatDate.js'
import formatPrice from '../../utils/formatPrice.js'

export default function Dashboard() {
  const { data, error, loading } = useLoad(getDashboard)

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Your store at a glance" />
      <ErrorBox message={error} />
      {loading && !data && <Loading />}

      {data && (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Total orders" value={data.totalOrders} />
            <Stat label="Waiting (pending)" value={data.pendingOrders} highlight={data.pendingOrders > 0}
              link="/admin/orders?status=PENDING" />
            <Stat label="Sales" value={formatPrice(data.totalSales)} hint="shipped and delivered orders" />
            <Stat label="Pieces in stock" value={data.piecesInStock} hint={`${data.activeProducts} products in shop`} link="/admin/products" />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_340px]">
            <Card>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl">Latest orders</h2>
                <Link to="/admin/orders" className="text-sm text-gold hover:underline">See all →</Link>
              </div>
              {data.recentOrders.length === 0 ? (
                <p className="mt-4 text-sm text-mulberry/60">No orders yet.</p>
              ) : (
                <ul className="mt-4 divide-y divide-gold-light/50">
                  {data.recentOrders.map((o) => (
                    <li key={o.orderNumber}>
                      <Link to={`/admin/orders/${o.orderNumber}`} className="flex flex-wrap items-center justify-between gap-2 py-3 hover:text-gold">
                        <span>
                          <span className="font-medium">{o.customerName}</span>
                          <span className="block text-xs text-mulberry/60">{o.orderNumber} · {formatDate(o.createdAt)}</span>
                        </span>
                        <span className="flex items-center gap-3">
                          <StatusBadge status={o.status} />
                          <span className="w-20 text-right font-medium">{formatPrice(o.total)}</span>
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card>
              <h2 className="font-display text-2xl">Low stock</h2>
              <p className="text-xs text-mulberry/60">5 pieces or fewer</p>
              {data.lowStock.length === 0 ? (
                <p className="mt-4 text-sm text-mulberry/60">All good ✓</p>
              ) : (
                <ul className="mt-4 space-y-2 text-sm">
                  {data.lowStock.map((p) => (
                    <li key={p.id}>
                      <Link to={`/admin/products/${p.id}`} className="flex justify-between gap-2 hover:text-gold">
                        <span className="truncate">{p.name}</span>
                        <span className={p.stock === 0 ? 'font-medium text-red-700' : 'text-amber-700'}>
                          {p.stock === 0 ? 'Sold out' : `${p.stock} left`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </>
      )}
    </>
  )
}

function Stat({ label, value, hint, highlight, link }) {
  const body = (
    <Card className={`h-full ${highlight ? 'border-amber-300 bg-amber-50/70' : ''} ${link ? 'hover:border-gold' : ''}`}>
      <p className="text-xs uppercase tracking-wider text-mulberry/60">{label}</p>
      <p className="mt-2 font-display text-3xl font-semibold">{value}</p>
      {hint && <p className="text-xs text-mulberry/50">{hint}</p>}
    </Card>
  )
  return link ? <Link to={link}>{body}</Link> : body
}
