import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'

const NEXT_AFTER_MS = 4000 // a new photo every 4 seconds

/**
 * The photos in the floating card of the home page banner, one after another (soft fade).
 * slides = [{ key, imageUrl, caption, link }] - your banner photos (Admin → Home banner),
 * or, if you haven't added any, the featured products' photos.
 * - ‹ › arrows and the dots below to move by hand, swipe on phones
 * - pauses while the mouse is over it
 * - one photo = no movement; no photos = the big "V" monogram
 */
export default function HeroSlideshow({ slides }) {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(null)
  const count = slides.length
  const current = count ? index % count : 0 // stays valid if the list gets shorter

  // Move on by itself (not while paused, not if the visitor prefers less motion)
  useEffect(() => {
    if (count < 2 || paused) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), NEXT_AFTER_MS)
    return () => clearTimeout(timer)
  }, [current, count, paused])

  if (count === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <span className="font-display text-[9rem] leading-none text-mulberry">V</span>
        <span className="mt-2 text-xs uppercase tracking-[0.4em] text-gold">Velora</span>
      </div>
    )
  }

  const go = (step) => setIndex((current + step + count) % count)

  return (
    <div
      className="relative h-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return
        const moved = e.changedTouches[0].clientX - touchStartX.current
        if (Math.abs(moved) > 40) go(moved < 0 ? 1 : -1) // swipe left = next, swipe right = previous
        touchStartX.current = null
      }}
    >
      {/* All photos on top of each other - only the current one is visible (fade) */}
      {slides.map((slide, i) => {
        const className = `absolute inset-0 transition-opacity duration-1000 ${i === current ? 'opacity-100' : 'pointer-events-none opacity-0'}`
        const content = (
          <>
            {/* The WHOLE photo is shown (nothing cut off). Any empty space around it is filled
                with a soft, blurred copy of the same photo, so the card always looks full. */}
            <img src={slide.imageUrl} alt="" aria-hidden className="absolute inset-0 h-full w-full scale-110 object-cover blur-xl brightness-90" />
            <img src={slide.imageUrl} alt={slide.caption ?? ''} className="relative h-full w-full object-contain" />
            {/* text at the bottom of the photo */}
            {slide.caption && (
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mulberry/70 to-transparent px-4 pb-8 pt-10 text-center font-display text-xl text-cream">
                {slide.caption}
              </span>
            )}
          </>
        )
        return slide.link ? (
          <Link key={slide.key} to={slide.link} tabIndex={i === current ? 0 : -1} aria-hidden={i !== current} className={className}>
            {content}
          </Link>
        ) : (
          <div key={slide.key} aria-hidden={i !== current} className={className}>{content}</div>
        )
      })}

      {count > 1 && (
        <>
          <button type="button" aria-label="Previous photo" onClick={() => go(-1)}
            className="absolute left-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/80 text-xl text-mulberry shadow transition hover:bg-cream">
            ‹
          </button>
          <button type="button" aria-label="Next photo" onClick={() => go(1)}
            className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-cream/80 text-xl text-mulberry shadow transition hover:bg-cream">
            ›
          </button>

          {/* Dots: one per photo, the current one is filled */}
          <div className="absolute inset-x-0 bottom-3 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button key={slide.key} type="button" aria-label={`Show photo ${i + 1}`} onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-cream' : 'w-2 bg-cream/60 hover:bg-cream'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
