import { useId, useState } from 'react'
import formatPrice from '../utils/formatPrice.js'

/**
 * City box with search: the customer types a few letters and the store's cities appear
 * underneath with their delivery price. Clicking one fills it in.
 * A city that's not in the list can simply be typed - it pays the "other cities" price.
 * Keyboard: ↑ / ↓ to move, Enter to choose, Esc to close.
 */
export default function CityPicker({ cities, otherFee, value, onChange, error, className = '' }) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)

  const query = value.trim().toLowerCase()
  const exact = cities.find((c) => c.name.toLowerCase() === query)
  // Cities starting with the typed letters come first, then the ones that contain them
  const matches = cities
    .filter((c) => c.name.toLowerCase().includes(query))
    .sort((a, b) => Number(!a.name.toLowerCase().startsWith(query)) - Number(!b.name.toLowerCase().startsWith(query)))

  function choose(city) {
    onChange(city.name)
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (!open || matches.length === 0) {
      if (e.key === 'ArrowDown') setOpen(true)
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => (h + 1) % matches.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => (h - 1 + matches.length) % matches.length)
    } else if (e.key === 'Enter') {
      e.preventDefault() // choose the city, don't send the form
      choose(matches[highlight] ?? matches[0])
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <label className="block">
        <span className="text-sm uppercase tracking-wider">City / town</span>
        <span className="relative mt-1 block">
          {/* magnifying glass */}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-mulberry/40">
            <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
          </svg>
          <input
            type="text"
            role="combobox"
            aria-expanded={open}
            aria-controls={listId}
            autoComplete="off"
            placeholder={cities.length ? 'Search your city, e.g. Beirut' : 'e.g. Jounieh'}
            value={value}
            onChange={(e) => { onChange(e.target.value); setOpen(true); setHighlight(0) }}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
            onKeyDown={handleKeyDown}
            className={`w-full rounded-xl border bg-white/70 py-3 pl-11 pr-4 outline-none focus:border-gold ${
              error ? 'border-red-400' : 'border-gold-light'
            }`}
          />
        </span>
      </label>

      {/* The suggestions under the box */}
      {open && cities.length > 0 && !exact && (
        <ul id={listId} role="listbox"
          className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-gold-light bg-white py-1 shadow-lg">
          {matches.map((c, i) => (
            <li key={c.id} role="option" aria-selected={i === highlight}
              // onMouseDown (not onClick) so it runs before the box loses focus and the list closes
              onMouseDown={(e) => { e.preventDefault(); choose(c) }}
              onMouseEnter={() => setHighlight(i)}
              className={`flex cursor-pointer justify-between gap-3 px-4 py-2.5 text-sm ${i === highlight ? 'bg-cream' : ''}`}>
              <span>{c.name}</span>
              <span className="text-mulberry/60">delivery {formatPrice(c.fee)}</span>
            </li>
          ))}
          {matches.length === 0 && (
            <li className="px-4 py-2.5 text-sm text-mulberry/70">
              Not in our list - no problem, we deliver there too for {formatPrice(otherFee)}.
            </li>
          )}
        </ul>
      )}

      {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
      {/* Tell them clearly which price applies */}
      {!error && query && !open && (
        <span className="mt-1 block text-xs text-mulberry/60">
          {exact ? <>✓ Delivery to {exact.name}: {formatPrice(exact.fee)}</> : <>Delivery to other cities: {formatPrice(otherFee)}</>}
        </span>
      )}
    </div>
  )
}
