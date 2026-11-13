import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { setMaintenance } from '../../api/admin.js'
import { getStoreStatus } from '../../api/catalog.js'
import { errorMessage } from '../../api/client.js'
import logo from '../../assets/velora-logo.svg'
import { useAuth } from '../../context/useAuth.js'
import useLoad from '../../hooks/useLoad.js'
import formatDate from '../../utils/formatDate.js'
import useOrderAlerts from './useOrderAlerts.js'

const LINKS = [
  { to: '/admin', label: 'Dashboard', icon: '◫', end: true },
  { to: '/admin/reports', label: 'Sales report', icon: '▥' },
  { to: '/admin/orders', label: 'Orders', icon: '▤' },
  { to: '/admin/products', label: 'Products', icon: '◇' },
  { to: '/admin/categories', label: 'Categories', icon: '▦' },
  { to: '/admin/customers', label: 'Customers', icon: '◯' },
  { to: '/admin/delivery', label: 'Delivery fees', icon: '⛟' },
  { to: '/admin/account', label: 'My account', icon: '⚿' },
]

/** The frame around every admin page: sidebar on the left, page content on the right. */
export default function AdminLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const shop = useShopSwitch()
  const alerts = useOrderAlerts() // "ding" + pop-up when a new order arrives

  // Browser tab says "Velora Admin" while you're in the admin panel
  useEffect(() => {
    const shopTitle = document.title
    document.title = 'Velora Admin'
    return () => {
      document.title = shopTitle
    }
  }, [])

  // Waiting orders also show in the tab name: "(2) Velora Admin"
  useEffect(() => {
    document.title = alerts.pending > 0 ? `(${alerts.pending}) Velora Admin` : 'Velora Admin'
  }, [alerts.pending])

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
      isActive ? 'bg-mulberry text-cream' : 'text-mulberry hover:bg-gold-light/30'
    }`

  return (
    <div className="min-h-screen md:flex">
      {/* Sidebar = a column: logo, shop switch, menu (takes the free space, scrolls if the screen is short), then your name at the bottom */}
      <aside className="border-b border-gold-light/60 bg-white/70 md:sticky md:top-0 md:flex md:h-screen md:w-60 md:shrink-0 md:flex-col md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link to="/admin"><img src={logo} alt="Velora" className="h-10" /></Link>
          <p className="min-w-0 truncate text-sm font-medium text-gold md:mt-2">{user?.fullName}</p>
        </div>

        <ShopSwitch shop={shop} />
        <AlertsControl alerts={alerts} />

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-x-visible md:overflow-y-auto">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              {/* fixed width so every label starts at the same place, whatever the icon's size */}
              <span aria-hidden className="w-5 shrink-0 text-center">{l.icon}</span>
              <span className="whitespace-nowrap">{l.label}</span>
              {/* red number = orders waiting for you */}
              {l.to === '/admin/orders' && alerts.pending > 0 && (
                <span className="ml-auto rounded-full bg-red-700 px-2 py-0.5 text-xs font-semibold text-white" title="Waiting orders">
                  {alerts.pending}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="hidden shrink-0 border-t border-gold-light/60 px-4 py-4 text-sm md:block">
          <a href="/" target="_blank" rel="noreferrer" className="block text-gold hover:underline">View shop ↗</a>
          <button type="button" className="mt-3 text-mulberry underline hover:text-red-700"
            onClick={() => { logout(); navigate('/admin/login') }}>
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">
        {/* Big red reminder on every admin page while the shop is closed */}
        {shop.closed && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-red-700 px-5 py-3 text-white">
            <p className="text-sm">
              <span className="font-semibold">⚠️ Shop is closed (maintenance)</span>
              {shop.since && <> since {formatDate(shop.since)}</>} - customers see the &quot;back soon&quot; page and can&apos;t order.
            </p>
            <button type="button" onClick={shop.toggle} disabled={shop.saving}
              className="rounded-full bg-white px-5 py-2 text-xs font-medium uppercase tracking-[0.15em] text-red-700 hover:bg-cream disabled:opacity-60">
              Open the shop
            </button>
          </div>
        )}
        {/* The current admin page appears here */}
        <Outlet />

        <div className="mt-12 flex gap-4 border-t border-gold-light/60 pt-4 text-sm md:hidden">
          <a href="/" target="_blank" rel="noreferrer" className="text-gold">View shop ↗</a>
          <button type="button" className="underline" onClick={() => { logout(); navigate('/admin/login') }}>Log out</button>
        </div>
      </main>
    </div>
  )
}

/** Loads the shop status and switches maintenance on/off (asks first). */
function useShopSwitch() {
  const { data, reload } = useLoad(getStoreStatus)
  const [saving, setSaving] = useState(false)
  const closed = Boolean(data?.maintenance)

  async function toggle() {
    const question = closed
      ? 'Open the shop again? Customers can browse and order straight away.'
      : 'Close the shop for maintenance?\n\n' +
        'Customers will see a "We\'ll be back soon" page and can\'t place orders. ' +
        'Their bags are kept. You can still use the admin panel and see the shop.'
    if (!window.confirm(question)) return
    setSaving(true)
    try {
      await setMaintenance(!closed)
      reload()
    } catch (err) {
      window.alert(errorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return { loaded: Boolean(data), closed, since: data?.maintenanceSince, saving, toggle }
}

/** The on/off switch in the sidebar: "Shop: Open / Closed". */
function ShopSwitch({ shop }) {
  if (!shop.loaded) return null
  return (
    <div className="mx-3 mb-3 flex items-center justify-between gap-3 rounded-lg border border-gold-light/70 bg-white px-3 py-2.5">
      <div className="text-sm">
        <p className="text-xs uppercase tracking-wider text-mulberry/60">Shop</p>
        <p className={`font-medium ${shop.closed ? 'text-red-700' : 'text-green-800'}`}>
          {shop.closed ? '● Closed (maintenance)' : '● Open'}
        </p>
      </div>
      <button type="button" role="switch" aria-checked={!shop.closed} aria-label="Shop open" onClick={shop.toggle} disabled={shop.saving}
        className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-60 ${shop.closed ? 'bg-red-700' : 'bg-green-700'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${shop.closed ? 'left-0.5' : 'left-5.5'}`} />
      </button>
    </div>
  )
}

/** "Turn on order alerts" button, or (once on) a small "Alerts on · Test" line. */
function AlertsControl({ alerts }) {
  if (alerts.permission === 'default') {
    return (
      <button type="button" onClick={alerts.enable}
        className="mx-3 mb-3 rounded-lg border border-gold bg-gold-light/20 px-3 py-2 text-left text-sm hover:bg-gold-light/40">
        🔔 Turn on new-order alerts
      </button>
    )
  }
  return (
    <p className="mx-3 mb-3 px-1 text-xs text-mulberry/70">
      {alerts.permission === 'granted' ? '🔔 Order alerts on' : '🔔 Sound alerts on (pop-ups blocked)'}
      {' · '}
      <button type="button" onClick={alerts.test} className="text-gold underline hover:text-mulberry">Test</button>
    </p>
  )
}
