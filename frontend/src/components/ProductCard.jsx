import { Link } from 'react-router-dom'
import formatPrice from '../utils/formatPrice.js'
import ProductImage from './ProductImage.jsx'

/** One product tile in the shop grid. Clicking it opens the product page. */
export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-gold-light/30">
        <ProductImage product={product} className="transition duration-500 group-hover:scale-105" />

        {!product.inStock && (
          <span className="absolute left-3 top-3 rounded-full bg-mulberry px-3 py-1 text-xs uppercase tracking-wider text-cream">
            Sold out
          </span>
        )}
      </div>

      <div className="mt-3 text-center">
        <p className="text-xs uppercase tracking-[0.2em] text-gold">{product.categoryName}</p>
        <h3 className="mt-1 font-display text-xl leading-tight group-hover:text-gold">{product.name}</h3>
        <p className="mt-1 font-medium">{formatPrice(product.price)}</p>
      </div>
    </Link>
  )
}
