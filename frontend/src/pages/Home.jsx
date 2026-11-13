import { Link } from 'react-router-dom'
import { getHome, getSlides } from '../api/catalog.js'
import ProductCard from '../components/ProductCard.jsx'
import HeroSlideshow from '../components/HeroSlideshow.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { STORE } from '../config/store.js'
import useLoad from '../hooks/useLoad.js'

export default function Home() {
  const { data, error } = useLoad(getHome)
  const banner = useLoad(getSlides)
  // The banner arch shows YOUR banner photos (Admin → Home banner).
  // None added yet? Then the featured products that have a photo. None of those? The "V".
  const ownSlides = (banner.data ?? []).map((s, i) => ({ ...s, key: `slide-${i}` }))
  const productSlides = (data?.featured ?? []).filter((p) => p.imageUrl)
    .map((p) => ({ key: `product-${p.id}`, imageUrl: p.imageUrl, caption: p.name, link: `/product/${p.slug}` }))
  const slides = ownSlides.length ? ownSlides : productSlides

  return (
    <>
      <Hero slides={slides} />

      {error && <p className="mt-10 text-center text-red-700">{error}</p>}

      {data && data.categories.length > 0 && (
        <Section eyebrow="Explore" title="Shop by category">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {data.categories.map((c) => <CategoryTile key={c.id} category={c} />)}
          </div>
        </Section>
      )}

      {data && data.featured.length > 0 && (
        <Section eyebrow="Our favourites" title="Featured pieces" link={{ to: '/shop', label: 'Shop all' }}>
          <ProductGrid products={data.featured} />
        </Section>
      )}

      <Promises />

      {data && data.newArrivals.length > 0 && (
        <Section eyebrow="Just in" title="New arrivals" link={{ to: '/shop', label: 'See everything' }}>
          <ProductGrid products={data.newArrivals} />
        </Section>
      )}
    </>
  )
}

/** The big welcome banner at the top. */
function Hero({ slides }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream via-cream to-gold-light/40">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-24">
        <div className="text-center md:text-left">
          <p className="text-xs uppercase tracking-[0.35em] text-gold">{STORE.heroEyebrow}</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-[1.05] md:text-7xl">{STORE.heroTitle}</h1>
          <p className="mx-auto mt-6 max-w-md text-mulberry/75 md:mx-0">{STORE.heroText}</p>
          {STORE.heroNote && (
            <p className="mt-3 text-xs uppercase tracking-[0.25em] text-gold">✦ {STORE.heroNote}</p>
          )}
          <div className="mt-10 flex flex-wrap justify-center gap-3 md:justify-start">
            <Link to="/shop" className="rounded-full bg-mulberry px-10 py-3.5 text-sm uppercase tracking-[0.2em] text-cream transition hover:bg-gold">
              Shop now
            </Link>
            <a href="#new-arrivals" className="rounded-full border border-mulberry/30 px-8 py-3.5 text-sm uppercase tracking-[0.2em] transition hover:border-gold hover:text-gold">
              New arrivals
            </a>
          </div>
        </div>

        {/* Floating photo card: a rounded rectangle that gently moves up and down, with a shadow.
            Shows your banner photos (slideshow), or the featured products' photos, or the V monogram. */}
        <div className="relative mx-auto w-full max-w-md">
          {/* thin gold frame, a little offset behind the card */}
          <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-3xl border border-gold/60" aria-hidden />
          <div className="hero-float relative aspect-4/5 overflow-hidden rounded-3xl bg-gradient-to-b from-cream to-gold-light/60 shadow-2xl shadow-mulberry/25 ring-1 ring-gold/40">
            <HeroSlideshow slides={slides} />
          </div>
        </div>
      </div>
    </section>
  )
}

/** A titled block of the page. */
function Section({ eyebrow, title, link, children }) {
  const id = title === 'New arrivals' ? 'new-arrivals' : undefined
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-6 px-4 pt-20">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl font-semibold">{title}</h2>
        </div>
        {link && <Link to={link.to} className="text-sm uppercase tracking-wider text-gold hover:underline">{link.label} →</Link>}
      </div>
      {children}
    </section>
  )
}

function ProductGrid({ products }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
      {products.map((p) => <ProductCard key={p.id} product={p} />)}
    </div>
  )
}

function CategoryTile({ category }) {
  return (
    <Link to={`/shop?category=${category.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border border-gold-light bg-gold-light/30">
        <ProductImage product={{ name: category.name, imageUrl: category.imageUrl }}
          className="transition duration-500 group-hover:scale-105" />
        {/* Dark fade at the bottom so the white text is readable on photos */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mulberry/80 to-transparent px-3 pb-4 pt-12 text-center">
          <p className="font-display text-2xl text-cream">{category.name}</p>
          <p className="text-xs uppercase tracking-wider text-cream/80">{category.productCount} pieces</p>
        </div>
      </div>
    </Link>
  )
}

/** The three short promises (text is in config/store.js). */
function Promises() {
  return (
    <section className="mt-20 border-y border-gold-light/70 bg-white/50">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-center md:grid-cols-3">
        {STORE.promises.map((p) => (
          <div key={p.title}>
            <div className="mx-auto h-10 w-8 rounded-t-full border-2 border-gold" aria-hidden />
            <h3 className="mt-4 font-display text-2xl">{p.title}</h3>
            <p className="mx-auto mt-2 max-w-xs text-sm text-mulberry/70">{p.text}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
