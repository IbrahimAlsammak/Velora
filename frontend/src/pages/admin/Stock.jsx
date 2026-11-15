import { useState } from 'react'
import { Link } from 'react-router-dom'
import { getAdminCategories, getAdminProducts } from '../../api/admin.js'
import { inputClass } from '../../components/admin/styles.js'
import { Card, ErrorBox, Loading, PageHeader } from '../../components/admin/ui.jsx'
import ProductImage from '../../components/ProductImage.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatPrice from '../../utils/formatPrice.js'

/** This many pieces or fewer = "running low" (shown in amber). */
const LOW = 2

/** Pieces of this colour + size (null = the product has no colour / no size). */
function count(product, color, size) {
  const v = product.variants.find((x) => (x.color ?? null) === color && (x.size ?? null) === size)
  return v ? v.stock : 0
}

/** Does this product have a colour + size that is sold out or running low? */
const needsAttention = (p) =>
  p.variants.length ? p.variants.some((v) => v.stock <= LOW) : p.stock <= LOW

/**
 * Admin → Stock: every product, grouped by category, with the number of pieces
 * left for each colour + size. Read-only - change numbers on the product's page.
 */
export default function Stock() {
  const products = useLoad(getAdminProducts)
  const categories = useLoad(getAdminCategories)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)

  if (products.loading || categories.loading) return <Loading />
  if (products.error || categories.error) return <ErrorBox message={products.error || categories.error} />

  const words = search.trim().toLowerCase()
  const shown = products.data.filter((p) =>
    (!category || String(p.categoryId) === category) &&
    (!words || p.name.toLowerCase().includes(words)) &&
    (!onlyLow || needsAttention(p)))

  const totalPieces = products.data.reduce((sum, p) => sum + p.stock, 0)
  // categories in the same order as on the Categories page; only those with products to show
  const groups = categories.data
    .map((c) => ({ ...c, products: shown.filter((p) => p.categoryId === c.id).sort((a, b) => a.name.localeCompare(b.name)) }))
    .filter((g) => g.products.length > 0)

  return (
    <>
      <PageHeader title="Stock" subtitle={`${totalPieces} pieces in ${products.data.length} product${products.data.length === 1 ? '' : 's'} - how many are left of each colour and size`} />

      {/* Filters */}
      <Card className="mb-6 flex flex-wrap items-center gap-3">
        <input className={`${inputClass} max-w-xs`} placeholder="Search a product…" value={search}
          onChange={(e) => setSearch(e.target.value)} />
        <select className={`${inputClass} max-w-xs`} value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>
          {categories.data.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} />
          Only sold out or running low
        </label>
        <span className="ml-auto flex gap-3 text-xs text-mulberry/70">
          <span><span className="inline-block h-3 w-3 rounded bg-red-100 align-middle ring-1 ring-red-300" /> sold out</span>
          <span><span className="inline-block h-3 w-3 rounded bg-amber-100 align-middle ring-1 ring-amber-300" /> {LOW} or fewer left</span>
        </span>
      </Card>

      {groups.length === 0 && <Card className="text-sm text-mulberry/60">No products here.</Card>}

      {groups.map((g) => (
        <section key={g.id} className="mb-10">
          <h2 className="mb-3 font-display text-3xl">
            {g.name}{' '}
            <span className="font-sans text-sm text-mulberry/60">
              · {g.products.length} product{g.products.length === 1 ? '' : 's'} · {g.products.reduce((s, p) => s + p.stock, 0)} pieces
            </span>
          </h2>
          <div className="grid gap-4 xl:grid-cols-2">
            {g.products.map((p) => <ProductStock key={p.id} product={p} />)}
          </div>
        </section>
      ))}
    </>
  )
}

/** One product: its photo, name and a table colours × sizes with the pieces left. */
function ProductStock({ product: p }) {
  const colors = p.colors.length ? p.colors.map((c) => c.name) : [null]
  const sizes = p.sizes.length ? p.sizes : [null]
  const simple = !p.variants.length // no colour / size choice: just one number

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-gold-light/30">
          <ProductImage product={p} />
        </div>
        <div className="min-w-0">
          <Link to={`/admin/products/${p.id}`} className="font-medium hover:text-gold">{p.name}</Link>
          <p className="text-xs text-mulberry/60">
            {formatPrice(p.price)} · {p.active ? 'visible in shop' : 'hidden'}
          </p>
        </div>
        <span className="ml-auto text-right">
          <span className="block font-display text-2xl leading-none">{p.stock}</span>
          <span className="text-xs text-mulberry/60">in total</span>
        </span>
      </div>

      {!simple && (
        <div className="overflow-x-auto">
          <table className="w-full text-center text-sm">
            {sizes[0] !== null && (
              <thead className="text-xs uppercase tracking-wider text-mulberry/60">
                <tr>
                  <th className="px-2 py-1 text-left">{colors[0] !== null ? 'Colour / Size' : ''}</th>
                  {sizes.map((s) => <th key={s} className="px-2 py-1">{s}</th>)}
                </tr>
              </thead>
            )}
            <tbody>
              {colors.map((c) => (
                <tr key={c ?? 'one'}>
                  <td className="px-2 py-1 text-left">{c ?? (sizes[0] !== null ? 'Pieces' : '')}</td>
                  {sizes.map((s) => {
                    const n = count(p, c, s)
                    const style = n === 0 ? 'bg-red-100 text-red-800' : n <= LOW ? 'bg-amber-100 text-amber-900' : 'bg-gold-light/20'
                    return (
                      <td key={s ?? 'one'} className="p-0.5">
                        <span className={`block rounded-md px-2 py-1.5 font-medium ${style}`}
                          title={`${[c, s].filter(Boolean).join(', ')}: ${n} left`}>
                          {n}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}
