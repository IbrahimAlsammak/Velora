import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart.js'
import ProductImage from './ProductImage.jsx'

const SHOW_FOR_MS = 4000 // the popup closes by itself after 4 seconds

/**
 * Small popup "Added to your bag", shown after pressing "Add to bag".
 * It sits in the shop layout (not on the product page), so it stays visible
 * while the customer is taken back to the shop.
 */
export default function AddedToBag() {
  const { lastAdded, hideAdded, count } = useCart()

  // Start the timer each time a new item is added
  useEffect(() => {
    if (!lastAdded) return
    const timer = setTimeout(hideAdded, SHOW_FOR_MS)
    return () => clearTimeout(timer)
  }, [lastAdded, hideAdded])

  if (!lastAdded) return null

  const details = [lastAdded.color, lastAdded.size, `Qty ${lastAdded.quantity}`].filter(Boolean).join(' · ')

  return (
    <div
      key={lastAdded.id}
      role="status"
      className="added-popup fixed inset-x-4 bottom-4 z-50 rounded-2xl border border-gold-light bg-cream p-4 shadow-2xl sm:inset-x-auto sm:bottom-auto sm:right-6 sm:top-24 sm:w-96"
    >
      <div className="flex items-start gap-4">
        <div className="h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-gold-light/30">
          <ProductImage product={lastAdded} letterClass="text-2xl" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-xs uppercase tracking-[0.2em] text-green-800">✓ Added to your bag</p>
          <p className="mt-1 truncate font-display text-xl font-semibold">{lastAdded.name}</p>
          <p className="text-sm text-mulberry/70">{details}</p>
        </div>

        <button type="button" onClick={hideAdded} aria-label="Close" className="-mr-1 -mt-1 px-2 text-xl leading-none text-mulberry/50 hover:text-mulberry">
          ×
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button type="button" onClick={hideAdded}
          className="rounded-full border border-mulberry py-2.5 text-xs uppercase tracking-[0.2em] transition hover:bg-mulberry hover:text-cream">
          Keep shopping
        </button>
        <Link to="/cart" onClick={hideAdded}
          className="rounded-full bg-mulberry py-2.5 text-center text-xs uppercase tracking-[0.2em] text-cream transition hover:bg-gold">
          View bag ({count})
        </Link>
      </div>
    </div>
  )
}
