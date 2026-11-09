/**
 * Shows the product photo, or - until real photos are added - a soft arch
 * (like the Velora logo) with the product's first letter.
 * Used by both the shop cards and the product page.
 */
export default function ProductImage({ product, className = '', letterClass = 'text-5xl' }) {
  if (product.imageUrl) {
    return <img src={product.imageUrl} alt={product.name} className={`h-full w-full object-cover ${className}`} />
  }
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-b from-cream to-gold-light/50 ${className}`}>
      <div className="flex h-2/3 w-1/2 items-center justify-center rounded-t-full border-2 border-gold/60">
        <span className={`font-display text-gold ${letterClass}`}>{product.name.charAt(0)}</span>
      </div>
    </div>
  )
}
