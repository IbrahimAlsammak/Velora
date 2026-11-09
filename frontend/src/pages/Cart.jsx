import { Link } from 'react-router-dom'
import ProductImage from '../components/ProductImage.jsx'
import QuantityPicker from '../components/QuantityPicker.jsx'
import { useCart } from '../context/useCart.js'
import formatPrice from '../utils/formatPrice.js'

export default function Cart() {
  const { items, subtotal, updateQuantity, removeItem } = useCart()

  if (items.length === 0) {
    return (
      <section className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl">Your bag is empty</h1>
        <p className="mt-3 text-mulberry/70">Find something you love in our collection.</p>
        <Link to="/shop" className="mt-8 inline-block rounded-full bg-mulberry px-10 py-3 text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold">
          Go to shop
        </Link>
      </section>
    )
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-display text-4xl md:text-5xl font-semibold">Your bag</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        {/* Left: the items */}
        <ul className="divide-y divide-gold-light/60 border-y border-gold-light/60">
          {items.map((item) => (
            <li key={item.key} className="flex gap-4 py-5">
              <Link to={`/product/${item.slug}`} className="block aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-lg">
                <ProductImage product={item} letterClass="text-2xl" />
              </Link>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <Link to={`/product/${item.slug}`} className="font-display text-xl leading-tight hover:text-gold">
                    {item.name}
                  </Link>
                  <p className="font-medium">{formatPrice(item.price * item.quantity)}</p>
                </div>
                <p className="mt-1 text-sm text-mulberry/70">
                  {[item.color, item.size].filter(Boolean).join(' · ') || 'One size'}
                </p>
                <p className="text-sm text-mulberry/70">{formatPrice(item.price)} each</p>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <QuantityPicker small value={item.quantity} onChange={(q) => updateQuantity(item.key, q)} />
                  <button type="button" onClick={() => removeItem(item.key)}
                    className="text-sm text-mulberry/60 underline hover:text-red-700">
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {/* Right: the summary */}
        <aside className="h-fit rounded-2xl border border-gold-light bg-white/60 p-6">
          <h2 className="font-display text-2xl">Summary</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{formatPrice(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Shipping</dt><dd>Free</dd></div>
          </dl>
          <div className="mt-4 flex justify-between border-t border-gold-light pt-4 text-lg font-medium">
            <span>Total</span><span>{formatPrice(subtotal)}</span>
          </div>
          <Link to="/checkout" className="mt-6 block rounded-full bg-mulberry py-3.5 text-center text-sm uppercase tracking-[0.2em] text-cream hover:bg-gold">
            Checkout
          </Link>
          <Link to="/shop" className="mt-3 block text-center text-sm text-gold underline">Continue shopping</Link>
        </aside>
      </div>
    </section>
  )
}
