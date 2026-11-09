import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getAdminProducts } from '../../api/admin.js'
import { Card, ErrorBox, Loading, PageHeader } from '../../components/admin/ui.jsx'
import { inputClass } from '../../components/admin/styles.js'
import ProductImage from '../../components/ProductImage.jsx'
import useLoad from '../../hooks/useLoad.js'
import formatPrice from '../../utils/formatPrice.js'

export default function Products() {
  const { data: products, error, loading } = useLoad(getAdminProducts)
  const [search, setSearch] = useState('')
  const navigate = useNavigate()

  const shown = (products ?? []).filter((p) =>
    `${p.name} ${p.categoryName}`.toLowerCase().includes(search.trim().toLowerCase()),
  )

  return (
    <>
      <PageHeader title="Products" subtitle={products ? `${products.length} products` : null}>
        <Link to="/admin/products/new"
          className="rounded-full bg-mulberry px-5 py-2 text-sm tracking-wider text-cream hover:bg-gold">
          + Add product
        </Link>
      </PageHeader>

      <input type="search" placeholder="Search products…" value={search} onChange={(e) => setSearch(e.target.value)}
        className={`mb-6 max-w-sm ${inputClass}`} />

      <ErrorBox message={error} />
      {loading && <Loading />}

      {!loading && products && (
        <Card className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-gold-light/70 text-xs uppercase tracking-wider text-mulberry/60">
              <tr>
                <th className="px-5 py-3">Product</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3 text-right">Price</th>
                <th className="px-5 py-3 text-right">Stock</th>
                <th className="px-5 py-3">In shop</th>
                <th className="px-5 py-3"><span className="sr-only">Edit</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gold-light/50">
              {shown.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/admin/products/${p.id}`)}
                  className={`cursor-pointer hover:bg-gold-light/15 ${p.active ? '' : 'opacity-60'}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="aspect-[3/4] w-10 shrink-0 overflow-hidden rounded">
                        <ProductImage product={p} letterClass="text-sm" />
                      </div>
                      <span className="font-medium">
                        {p.name}
                        {p.featured && <span className="ml-2 text-gold" title="Featured">★</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-mulberry/70">{p.categoryName}</td>
                  <td className="px-5 py-3 text-right">{formatPrice(p.price)}</td>
                  <td className={`px-5 py-3 text-right font-medium ${p.stock === 0 ? 'text-red-700' : p.stock <= 5 ? 'text-amber-700' : ''}`}>
                    {p.stock}
                  </td>
                  <td className="px-5 py-3">{p.active ? 'Visible' : 'Hidden'}</td>
                  <td className="px-5 py-3 text-right">
                    <Link to={`/admin/products/${p.id}`} onClick={(e) => e.stopPropagation()}
                      className="rounded-full border border-gold-light px-4 py-1.5 text-xs uppercase tracking-wider hover:border-gold hover:text-gold">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-6 text-mulberry/60">No products match.</td></tr>
              )}
            </tbody>
          </table>
        </Card>
      )}
    </>
  )
}
