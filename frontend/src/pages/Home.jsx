import { Link } from 'react-router-dom'
import { getHome } from '../api/catalog.js'
import ProductCard from '../components/ProductCard.jsx'
import ProductImage from '../components/ProductImage.jsx'
import { STORE } from '../config/store.js'
import useLoad from '../hooks/useLoad.js'

export default function Home() {
  const { data, error } = useLoad(getHome)
  // The banner shows the first featured product that has a photo (if there is one)
  const heroProduct = data?.featured.find((p) => p.imageUrl)

  return (
    <>
      <Hero product={heroProduct} />

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
function Hero({ product }) {
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

        {/* Arch frame, like the logo. Shows a featured product photo, or the V monogram. */}
        <div className="relative mx-auto w-64 sm:w-80 md:w-96">
          <div className="absolute -inset-4 rounded-t-full border border-gold/50" aria-hidden />
          <div className="relative aspect-[3/4] overflow-hidden rounded-t-full border-2 border-gold/70 bg-gradient-to-b from-cream to-gold-light/60">
            {product ? (
              <Link to={`/product/${product.slug}`} className="block h-full">
                <ProductImage product={product} className="transition duration-700 hover:scale-105" />
              </Link>
            ) : (
              <div className="flex h-full flex-col items-center justify-center">
                <span className="font-display text-[9rem] leading-none text-mulberry">V</span>
                <span className="mt-2 text-xs uppercase tracking-[0.4em] text-gold">Velora</span>
              </div>
            )}
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
