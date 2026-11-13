import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getCategories, getProducts } from '../api/catalog.js'
import ProductCard from '../components/ProductCard.jsx'

export default function Shop() {
  // The chosen category lives in the address bar: /shop?category=hijabs
  // (so the link can be shared, and the browser Back button works)
  const [searchParams, setSearchParams] = useSearchParams()
  const activeCategory = searchParams.get('category') || ''

  const [categories, setCategories] = useState([])
  // The last answer from the backend, remembering WHICH category it was for
  const [result, setResult] = useState({ category: null, products: [], error: null })

  // Load the category buttons once
  useEffect(() => {
    getCategories().then(setCategories).catch(() => {})
  }, [])

  // Load products every time the chosen category changes
  useEffect(() => {
    let cancelled = false // ignore old answers if the user clicks another category quickly
    getProducts(activeCategory)
      .then((products) => !cancelled && setResult({ category: activeCategory, products, error: null }))
      .catch(() =>
        !cancelled &&
        setResult({ category: activeCategory, products: [], error: 'Could not load products. Is the backend running?' }),
      )
    return () => {
      cancelled = true
    }
  }, [activeCategory])

  // Still loading if the answer we have is for a different category
  const loading = result.category !== activeCategory
  const { products, error } = result

  const chooseCategory = (slug) => setSearchParams(slug ? { category: slug } : {})
  const current = categories.find((c) => c.slug === activeCategory)

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <header className="text-center">
        <h1 className="font-display text-4xl md:text-5xl font-semibold">{current ? current.name : 'Shop All'}</h1>
        <p className="mx-auto mt-3 max-w-xl text-mulberry/70">
          {current ? current.description : 'Discover our modest fashion, makeup sets and bags.'}
        </p>
      </header>

      {/* Category filter buttons */}
      <nav className="mt-8 flex flex-wrap justify-center gap-2">
        <FilterButton active={!activeCategory} onClick={() => chooseCategory('')}>All</FilterButton>
        {categories.map((c) => (
          <FilterButton key={c.id} active={activeCategory === c.slug} onClick={() => chooseCategory(c.slug)}>
            {c.name}
          </FilterButton>
        ))}
      </nav>

      {/* Products */}
      <div className="mt-10">
        {error && <p className="text-center text-red-700">{error}</p>}
        {loading && !error && <p className="text-center text-gold">Loading…</p>}
        {!loading && !error && products.length === 0 && (
          <p className="text-center text-mulberry/70">No products here yet.</p>
        )}
        {!loading && !error && products.length > 0 && (
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

function FilterButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-5 py-2 text-sm uppercase tracking-wider transition ${
        active
          ? 'border-mulberry bg-mulberry text-cream'
          : 'border-gold-light text-mulberry hover:border-gold hover:text-gold'
      }`}
    >
      {children}
    </button>
  )
}
