import { Link } from 'react-router-dom'
import { getMyOrders } from '../../api/account.js'
import OrderCard from '../../components/account/OrderCard.jsx'
import { STORE } from '../../config/store.js'
import { useAuth } from '../../context/useAuth.js'
import useLoad from '../../hooks/useLoad.js'
import formatPrice from '../../utils/formatPrice.js'
import { isActiveOrder } from '../../utils/orderStatus.js'
import { whatsappUrl } from '../../utils/phone.js'

/** The first page of "My account": a short summary of everything. */
export default function Overview() {
  const { user } = useAuth()
  const { data: orders, error, loading } = useLoad(getMyOrders)

  const list = orders ?? []
  const active = list.filter(isActiveOrder)
  const spent = list.filter((o) => o.status !== 'CANCELLED').reduce((sum, o) => sum + Number(o.total), 0)
  const latest = list[0] // newest first

  return (
    <div>
      <h2 className="font-display text-3xl">Welcome back, {user.fullName.split(' ')[0]}</h2>
      <p className="mt-1 text-sm text-mulberry/60">From here you can follow your orders and manage your details.</p>

      {/* Numbers */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="Orders" value={orders ? list.length : '–'} />
        <Stat label="In progress" value={orders ? active.length : '–'} />
        <Stat label="Total spent" value={orders ? formatPrice(spent) : '–'} />
      </div>

      {/* Latest order */}
      <div className="mt-10 flex items-end justify-between gap-3">
        <h3 className="font-display text-2xl">Latest order</h3>
        {list.length > 1 && <Link to="/account/orders" className="text-sm text-gold hover:underline">See all orders →</Link>}
      </div>
      <div className="mt-3">
        {error && <p className="text-sm text-red-700">{error}</p>}
        {loading && !orders && <p className="text-gold">Loading…</p>}
        {orders && !latest && (
          <div className="rounded-2xl border border-dashed border-gold-light p-8 text-center">
            <p className="text-mulberry/70">You haven't ordered anything yet.</p>
            <Link to="/shop" className="mt-4 inline-block rounded-full bg-mulberry px-8 py-3 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold">
              Start shopping
            </Link>
          </div>
        )}
        {latest && <OrderCard order={latest} />}
      </div>

      {/* Shortcuts */}
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Shortcut to="/account/details" title="Personal information" text="Your name and phone number" />
        <Shortcut to="/account/password" title="Password & security" text="Change your password" />
      </div>

      {/* Help */}
      {STORE.whatsapp && (
        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-mulberry px-6 py-5 text-cream">
          <div>
            <p className="font-display text-2xl">Need help with an order?</p>
            <p className="text-sm text-cream/70">Message us on WhatsApp - we usually reply the same day.</p>
          </div>
          <a href={whatsappUrl(STORE.whatsapp)} target="_blank" rel="noreferrer"
            className="rounded-full border border-cream/40 px-6 py-2.5 text-sm uppercase tracking-wider hover:bg-cream hover:text-mulberry">
            WhatsApp us
          </a>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-gold-light bg-white/70 p-4">
      <p className="text-[11px] uppercase tracking-wider text-mulberry/60">{label}</p>
      <p className="mt-1 truncate font-display text-2xl md:text-3xl">{value}</p>
    </div>
  )
}

function Shortcut({ to, title, text }) {
  return (
    <Link to={to} className="flex items-center justify-between rounded-2xl border border-gold-light bg-white/70 p-5 hover:border-gold">
      <span>
        <span className="block font-medium">{title}</span>
        <span className="block text-sm text-mulberry/60">{text}</span>
      </span>
      <span className="text-gold">→</span>
    </Link>
  )
}
