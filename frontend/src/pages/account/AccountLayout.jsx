import { Navigate, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { formatPhone } from '../../utils/phone.js'

// The sections of "My account". Each one has its own address, e.g. /account/orders
const SECTIONS = [
  { to: '/account', end: true, label: 'Overview', icon: 'M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z' },
  { to: '/account/orders', label: 'My orders', icon: 'M5 7h14l-1 13H6zM9 7a3 3 0 0 1 6 0' },
  { to: '/account/details', label: 'Personal information', icon: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0' },
  { to: '/account/password', label: 'Password & security', icon: 'M6 11h12v10H6zM8 11V7a4 4 0 0 1 8 0v4' },
]

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"
      strokeLinecap="round" className="h-5 w-5 shrink-0" aria-hidden="true">
      <path d={d} />
    </svg>
  )
}

/** The frame around every account page: header + menu on the left + the chosen section. */
export default function AccountLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return <Navigate to="/login" replace state={{ from: '/account' }} />

  const initials = user.fullName.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-gold-light/60 pb-8">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-mulberry font-display text-2xl text-cream">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">My account</p>
          <h1 className="truncate font-display text-3xl font-semibold md:text-4xl">{user.fullName}</h1>
          <p className="text-sm text-mulberry/60">{user.phone ? formatPhone(user.phone) : user.email}</p>
        </div>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr] md:gap-12">
        {/* Menu: a column on computers, a row of tabs on phones */}
        <nav className="-mx-4 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
          <ul className="flex gap-2 md:flex-col md:gap-1">
            {SECTIONS.map((s) => (
              <li key={s.to}>
                <NavLink to={s.to} end={s.end}
                  className={({ isActive }) => `flex items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm transition ${
                    isActive ? 'bg-mulberry text-cream' : 'hover:bg-white/70 hover:text-gold'
                  }`}>
                  <Icon d={s.icon} />
                  {s.label}
                </NavLink>
              </li>
            ))}
            <li className="md:mt-4 md:border-t md:border-gold-light/60 md:pt-4">
              <button type="button" onClick={() => { logout(); navigate('/') }}
                className="flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm text-mulberry/70 hover:bg-white/70 hover:text-red-700">
                <Icon d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />
                Log out
              </button>
            </li>
          </ul>
        </nav>

        <div className="min-w-0">
          <Outlet />
        </div>
      </div>
    </section>
  )
}
