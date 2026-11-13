/**
 * Stock per colour + size, on the product page.
 * product.variants = [{ color: 'Black', size: 'M', stock: 3 }, ...]  (empty for simple products)
 * "null" colour/size = the product has no colour/size choice.
 */

/** Pieces left of exactly this colour + size. */
export function stockOf(product, color, size) {
  if (!product.variants?.length) return product.inStock ? Infinity : 0 // simple product: just "in stock" or not
  const v = product.variants.find((x) => (x.color ?? null) === (color ?? null) && (x.size ?? null) === (size ?? null))
  return v ? v.stock : 0
}

/** Can this colour still be bought? (with the chosen size, or in any size if none chosen yet) */
export function colorAvailable(product, color, size) {
  if (!product.variants?.length) return product.inStock
  if (size || product.sizes.length === 0) return stockOf(product, color, size ?? null) > 0
  return product.variants.some((v) => v.color === color && v.stock > 0)
}

/** Can this size still be bought? (in the chosen colour, or in any colour if none chosen yet) */
export function sizeAvailable(product, size, color) {
  if (!product.variants?.length) return product.inStock
  if (color || product.colors.length === 0) return stockOf(product, color ?? null, size) > 0
  return product.variants.some((v) => v.size === size && v.stock > 0)
}
