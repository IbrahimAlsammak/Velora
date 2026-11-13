import { useEffect } from 'react'
import logo from '../assets/velora-logo.svg'
import { STORE } from '../config/store.js'
import { whatsappUrl } from '../utils/phone.js'

const CHECK_EVERY_MS = 30000 // look again every 30 seconds - the shop opens by itself when you switch it back

/**
 * The "We'll be back soon" page customers see while the shop is under maintenance.
 * Turned on and off from the admin panel. Their bag is kept (it's saved in their browser).
 */
export default function MaintenancePage({ onCheckAgain }) {
  useEffect(() => {
    const timer = setInterval(onCheckAgain, CHECK_EVERY_MS)
    return () => clearInterval(timer)
  }, [onCheckAgain])

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-cream to-gold-light/30 px-6 text-center">
      <img src={logo} alt="Velora" className="h-16" />
      <p className="mt-10 text-xs uppercase tracking-[0.3em] text-gold">✦ Under maintenance ✦</p>
      <h1 className="mt-4 font-display text-5xl font-semibold leading-tight md:text-6xl">We&apos;ll be back soon</h1>
      <p className="mt-5 max-w-md text-mulberry/75">
        We&apos;re making a few updates to the shop. Your bag is saved - come back in a little while.
      </p>

      {STORE.whatsapp && (
        <a href={whatsappUrl(STORE.whatsapp)} target="_blank" rel="noreferrer"
          className="mt-10 rounded-full bg-mulberry px-8 py-3.5 text-sm uppercase tracking-[0.2em] text-cream transition hover:bg-gold">
          Message us on WhatsApp
        </a>
      )}
      {STORE.instagram && (
        <a href={STORE.instagram} target="_blank" rel="noreferrer" className="mt-4 text-sm text-gold hover:underline">
          Follow us on Instagram
        </a>
      )}
    </main>
  )
}
