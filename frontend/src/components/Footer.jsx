import { Link } from 'react-router-dom'
import logoWhite from '../assets/velora-logo-white.svg'
import { STORE } from '../config/store.js'

const YEAR = new Date().getFullYear()

/** The bottom of every shop page. Contact + social links come from config/store.js */
export default function Footer() {
  const socials = [
    { label: 'Instagram', url: STORE.instagram },
    { label: 'TikTok', url: STORE.tiktok },
    { label: 'Facebook', url: STORE.facebook },
  ].filter((s) => s.url) // only the ones you filled in

  return (
    <footer className="mt-20 bg-mulberry text-cream">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <img src={logoWhite} alt="Velora" className="h-12" />
          <p className="mt-4 max-w-sm text-sm text-cream/70">
            Modest clothing with quiet elegance - made to feel as good as it looks.
          </p>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.25em] text-gold-light">Shop</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            <li><Link to="/shop" className="hover:text-gold-light">All products</Link></li>
            <li><Link to="/cart" className="hover:text-gold-light">Your bag</Link></li>
            <li><Link to="/account" className="hover:text-gold-light">My account</Link></li>
            <li><Link to="/contact" className="hover:text-gold-light">Contact us</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-xs uppercase tracking-[0.25em] text-gold-light">Get in touch</h3>
          <ul className="mt-4 space-y-2 text-sm text-cream/80">
            {STORE.email && <li><a href={`mailto:${STORE.email}`} className="hover:text-gold-light">{STORE.email}</a></li>}
            {STORE.phone && <li><a href={`tel:${STORE.phone}`} className="hover:text-gold-light">{STORE.phone}</a></li>}
            {socials.map((s) => (
              <li key={s.label}>
                <a href={s.url} target="_blank" rel="noreferrer" className="hover:text-gold-light">{s.label} ↗</a>
              </li>
            ))}
            {!STORE.email && !STORE.phone && socials.length === 0 && (
              <li className="text-cream/50">Contact details coming soon</li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-cream/10 py-5 text-center text-xs tracking-[0.25em] text-cream/50">
        © {YEAR} VELORA · MODEST · ELEGANCE
      </div>
    </footer>
  )
}
