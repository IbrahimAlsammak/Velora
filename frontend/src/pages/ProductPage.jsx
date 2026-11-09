import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProduct, getProducts } from '../api/catalog.js'
import ProductCard from '../components/ProductCard.jsx'
import ProductImage from '../components/ProductImage.jsx'
import QuantityPicker from '../components/QuantityPicker.jsx'
import { useCart } from '../context/useCart.js'
import formatPrice from '../utils/formatPrice.js'

export default function ProductPage() {
  const { slug } = useParams() // the part after /product/ in the address
  const [state, setState] = useState({ slug: null, product: null, related: [], error: null })

  // Load the product (and a few others from the same category) when the address changes
  useEffect(() => {
    let cancelled = false
    getProduct(slug)
      .then(async (product) => {
        const others = await getProducts(product.categorySlug).catch(() => [])
        const related = others.filter((p) => p.slug !== slug).slice(0, 4)
        if (!cancelled) setState({ slug, product, related, error: null })
      })
      .catch((err) => {
        const msg = err.response?.status === 404 ? 'not-found' : 'Could not load this product. Is the backend running?'
        if (!cancelled) setState({ slug, product: null, related: [], error: msg })
      })
    return () => {
      cancelled = true
    }
  }, [slug])

  if (state.slug !== slug) return <p className="py-24 text-center text-gold">Loading…</p>
  if (state.error === 'not-found') {
    return (
      <section className="py-24 text-center">
        <h1 className="font-display text-4xl">Product not found</h1>
        <Link to="/shop" className="mt-6 inline-block text-gold underline">Back to the shop</Link>
      </section>
    )
  }
  if (state.error) return <p className="py-24 text-center text-red-700">{state.error}</p>

  // key={slug} = start fresh (no colour/size selected) when moving to another product
  return <ProductDetails key={slug} product={state.product} related={state.related} />
}

function ProductDetails({ product, related }) {
  const { addItem } = useCart()
  const [color, setColor] = useState(product.colors.length === 1 ? product.colors[0].name : null)
  const [size, setSize] = useState(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [showHint, setShowHint] = useState(false)

  const needsColor = product.colors.length > 0 && !color
  const needsSize = product.sizes.length > 0 && !size

  function handleAdd() {
    if (needsColor || needsSize) {
      setShowHint(true)
      return
    }
    addItem(product, { color, size, quantity })
    setAdded(true)
    setShowHint(false)
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10">
      {/* Breadcrumb: Shop / Abayas / Product */}
      <nav className="text-xs uppercase tracking-wider text-mulberry/60">
        <Link to="/shop" className="hover:text-gold">Shop</Link>
        <span className="mx-2">/</span>
        <Link to={`/shop?category=${product.categorySlug}`} className="hover:text-gold">{product.categoryName}</Link>
        <span className="mx-2">/</span>
        <span className="text-mulberry">{product.name}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        {/* Left: photos */}
        <Gallery product={product} />

        {/* Right: details */}
        <div className="md:py-4">
          <p className="text-xs uppercase tracking-[0.25em] text-gold">{product.categoryName}</p>
          <h1 className="mt-2 font-display text-4xl md:text-5xl font-semibold leading-tight">{product.name}</h1>
          <p className="mt-4 text-2xl">{formatPrice(product.price)}</p>
          <p className={`mt-2 text-sm ${product.inStock ? 'text-green-800' : 'text-red-700'}`}>
            {product.inStock ? '● In stock' : '● Sold out'}
          </p>

          <p className="mt-6 leading-relaxed text-mulberry/80">{product.description}</p>

          {/* Colour choice */}
          {product.colors.length > 0 && (
            <div className="mt-8">
              <p className="text-sm uppercase tracking-wider">
                Colour: <span className="text-gold normal-case tracking-normal">{color ?? 'choose one'}</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-3">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    title={c.name}
                    aria-label={c.name}
                    onClick={() => { setColor(c.name); setAdded(false) }}
                    className={`h-9 w-9 rounded-full border border-mulberry/20 ring-offset-2 ring-offset-cream transition ${
                      color === c.name ? 'ring-2 ring-mulberry' : 'hover:ring-2 hover:ring-gold-light'
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size choice */}
          <div className="mt-6">
            <p className="text-sm uppercase tracking-wider">
              Size: <span className="text-gold normal-case tracking-normal">
                {product.sizes.length === 0 ? 'One size' : size ?? 'choose one'}
              </span>
            </p>
            {product.sizes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => { setSize(s); setAdded(false) }}
                    className={`min-w-12 rounded-full border px-4 py-2 text-sm transition ${
                      size === s ? 'border-mulberry bg-mulberry text-cream' : 'border-gold-light hover:border-gold'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quantity + Add to bag */}
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <QuantityPicker value={quantity} onChange={setQuantity} />

            <button
              type="button"
              disabled={!product.inStock}
              onClick={handleAdd}
              className="flex-1 rounded-full bg-mulberry px-8 py-3.5 text-sm uppercase tracking-[0.2em] text-cream transition hover:bg-gold disabled:cursor-not-allowed disabled:bg-mulberry/40"
            >
              {product.inStock ? 'Add to bag' : 'Sold out'}
            </button>
          </div>

          {showHint && (
            <p className="mt-3 text-sm text-red-700">
              Please choose {needsColor && needsSize ? 'a colour and a size' : needsColor ? 'a colour' : 'a size'}.
            </p>
          )}
          {added && <p className="mt-3 text-sm text-green-800">✓ Added to your bag</p>}
        </div>
      </div>

      {/* More from the same category */}
      {related.length > 0 && (
        <div className="mt-20">
          <h2 className="text-center font-display text-3xl">You may also like</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      )}
    </section>
  )
}

/** Big photo + small thumbnails underneath. Click (or tap) a thumbnail to show it big. */
function Gallery({ product }) {
  const images = product.images?.length ? product.images : []
  const [index, setIndex] = useState(0)
  const current = images[index]

  return (
    <div>
      <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-gold-light/30">
        <ProductImage product={{ name: product.name, imageUrl: current }} letterClass="text-8xl" />
      </div>
      {images.length > 1 && (
        <div className="mt-3 grid grid-cols-5 gap-2">
          {images.map((url, i) => (
            <button key={url} type="button" onClick={() => setIndex(i)} aria-label={`Show photo ${i + 1}`}
              className={`aspect-[3/4] overflow-hidden rounded-lg border-2 transition ${
                i === index ? 'border-mulberry' : 'border-transparent opacity-70 hover:opacity-100'
              }`}>
              <img src={url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
