import { Link, NavLink } from 'react-router-dom'
import logo from '../assets/velora-logo.svg'
import { useAuth } from '../context/useAuth.js'
import { useCart } from '../context/useCart.js'

// NavLink knows which page you're on, so we can colour the active link gold.
const linkClass = ({ isActive }) => (isActive ? 'text-gold' : 'hover:text-gold')

export default function Navbar() {
  const { count } = useCart()
  const { user, isAdmin } = useAuth() // isAdmin = true only when YOU are logged in as admin

  return (
    <header className="border-b border-gold-light/60 bg-cream">
      <nav className="mx-auto max-w-6xl flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex min-w-0 items-center gap-4 lg:gap-6">
          <Link to="/" className="shrink-0">
            <img src={logo} alt="Velora" className="h-10 sm:h-12" />
          </Link>
          {/* Logged in -> a small greeting next to the logo (hidden on phones, there isn't room) */}
          {user && (
            <Link to={isAdmin ? '/admin' : '/account'}
              className="hidden truncate border-l border-gold-light/70 pl-4 font-display text-xl italic hover:text-gold md:block lg:pl-6">
              Hello, {user.fullName.split(' ')[0]}
            </Link>
          )}
        </div>
        {/* Smaller gaps on phones so everything fits on one line */}
        <ul className="flex items-center gap-3 text-xs tracking-wider uppercase sm:gap-6 sm:text-sm">
          {/* On phones the logo already links home, so "Home" is hidden there */}
          <li className="hidden sm:block"><NavLink to="/" end className={linkClass}>Home</NavLink></li>
          <li><NavLink to="/shop" className={linkClass}>Shop</NavLink></li>
          <li><NavLink to="/contact" className={linkClass}>Contact</NavLink></li>
          {/* Only visible to a logged-in admin - customers never see this link */}
          {isAdmin && (
            <li>
              <Link to="/admin" className="rounded-full border border-gold px-3 py-1 text-gold hover:bg-gold hover:text-cream">
                Admin
              </Link>
            </li>
          )}
          <li>
            <NavLink to={user ? '/account' : '/login'} className={linkClass}>
              {user ? 'Account' : 'Log in'}
            </NavLink>
          </li>
          <li>
            <NavLink to="/cart" className={(s) => `flex items-center gap-2 ${linkClass(s)}`}>
              Bag
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-mulberry px-1.5 text-xs text-cream">
                {count}
              </span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </header>
  )
}
