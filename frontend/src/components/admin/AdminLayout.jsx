import { useEffect } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import logo from '../../assets/velora-logo.svg'
import { useAuth } from '../../context/useAuth.js'

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

  // Browser tab says "Velora Admin" while you're in the admin panel
  useEffect(() => {
    const shopTitle = document.title
    document.title = 'Velora Admin'
    return () => {
      document.title = shopTitle
    }
  }, [])

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition ${
      isActive ? 'bg-mulberry text-cream' : 'text-mulberry hover:bg-gold-light/30'
    }`

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-gold-light/60 bg-white/70 md:sticky md:top-0 md:h-screen md:w-60 md:shrink-0 md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block">
          <Link to="/admin"><img src={logo} alt="Velora" className="h-10" /></Link>
          <p className="text-xs uppercase tracking-[0.25em] text-gold md:mt-2">Admin</p>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-col md:overflow-visible">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} end={l.end} className={linkClass}>
              <span aria-hidden>{l.icon}</span>
              <span className="whitespace-nowrap">{l.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="hidden border-t border-gold-light/60 px-4 py-4 text-sm md:absolute md:bottom-0 md:block md:w-full">
          <a href="/" target="_blank" rel="noreferrer" className="block text-gold hover:underline">View shop ↗</a>
          <p className="mt-3 font-medium text-mulberry">{user?.fullName}</p>
          <p className="truncate text-mulberry/60" title={user?.email}>{user?.email}</p>
          <button type="button" className="mt-1 text-mulberry underline hover:text-red-700"
            onClick={() => { logout(); navigate('/admin/login') }}>
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 px-4 py-6 md:px-10 md:py-10">
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
