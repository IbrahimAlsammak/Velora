import { useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  createProduct, deleteProduct, getAdminCategories, getAdminProduct, updateProduct, uploadPhoto,
} from '../../api/admin.js'
import { errorMessage } from '../../api/client.js'
import { inputClass } from '../../components/admin/styles.js'
import { Button, Card, ErrorBox, Field, Loading, PageHeader } from '../../components/admin/ui.jsx'
import ProductImage from '../../components/ProductImage.jsx'
import useLoad from '../../hooks/useLoad.js'

/** Most photos one product can have. */
const MAX_PHOTOS = 10

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

const EMPTY_PRODUCT = {
  name: '', description: '', price: '', stock: 0, categoryId: '', active: true, featured: false,
  images: [], colors: [], sizes: [],
}

/** /admin/products/new = add a product,  /admin/products/7 = edit product 7 */
export default function ProductForm() {
  const { id } = useParams()
  const isNew = !id
  const categories = useLoad(getAdminCategories)
  const product = useLoad(() => (isNew ? Promise.resolve(null) : getAdminProduct(id)), [id])

  if (categories.loading || product.loading) return <Loading />
  if (categories.error || product.error) return <ErrorBox message={categories.error || product.error} />

  // key = start a fresh form for each product
  return <Editor key={id ?? 'new'} initial={product.data ?? EMPTY_PRODUCT} id={id} categories={categories.data} />
}

function Editor({ initial, id, categories }) {
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [form, setForm] = useState({
    ...initial,
    description: initial.description ?? '',
    images: initial.images ?? [], // all photos, first = main
    categoryId: initial.categoryId ?? '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [customSize, setCustomSize] = useState('')

  const set = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  // ---------- Photos (several; the first is the main photo) ----------
  async function handlePhotos(e) {
    const files = [...(e.target.files ?? [])]
    e.target.value = '' // allow choosing the same files again later
    if (files.length === 0) return
    const room = MAX_PHOTOS - form.images.length
    if (files.length > room) {
      setError(`You can add ${room} more photo(s) - up to ${MAX_PHOTOS} per product.`)
      files.splice(room)
    } else {
      setError(null)
    }
    setUploading(true)
    for (const file of files) {
      try {
        const url = await uploadPhoto(file) // one by one, so each finished photo appears right away
        setForm((f) => ({ ...f, images: [...f.images, url] }))
      } catch (err) {
        setError(`${file.name}: ${errorMessage(err)}`)
      }
    }
    setUploading(false)
  }

  const removePhoto = (index) => set('images', form.images.filter((_, i) => i !== index))

  /** Move a photo left (-1) or right (+1). Position 1 = main photo. */
  function movePhoto(index, step) {
    const target = index + step
    if (target < 0 || target >= form.images.length) return
    const next = [...form.images]
    ;[next[index], next[target]] = [next[target], next[index]]
    set('images', next)
  }

  function makeMain(index) {
    const next = [...form.images]
    const [photo] = next.splice(index, 1)
    set('images', [photo, ...next])
  }

  // ---------- Colours ----------
  const addColor = () => set('colors', [...form.colors, { name: '', hex: '#B08A5E' }])
  const updateColor = (index, field, value) =>
    set('colors', form.colors.map((c, i) => (i === index ? { ...c, [field]: value } : c)))
  const removeColor = (index) => set('colors', form.colors.filter((_, i) => i !== index))

  // ---------- Sizes ----------
  const toggleSize = (size) =>
    set('sizes', form.sizes.includes(size) ? form.sizes.filter((s) => s !== size) : [...form.sizes, size])
  function addCustomSize() {
    const s = customSize.trim()
    if (s && !form.sizes.includes(s)) set('sizes', [...form.sizes, s])
    setCustomSize('')
  }

  // ---------- Save / delete ----------
  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})
    const body = {
      ...form,
      price: form.price === '' ? null : Number(form.price),
      stock: Number(form.stock) || 0,
      categoryId: form.categoryId === '' ? null : Number(form.categoryId),
    }
    try {
      if (id) await updateProduct(id, body)
      else await createProduct(body)
      navigate('/admin/products')
    } catch (err) {
      setFieldErrors(err.response?.data?.fields ?? {})
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${initial.name}" for good?`)) return
    setBusy(true)
    setError(null)
    try {
      await deleteProduct(id)
      navigate('/admin/products')
    } catch (err) {
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <form onSubmit={handleSave} noValidate>
      <Link to="/admin/products" className="text-sm text-gold hover:underline">← All products</Link>
      <PageHeader title={id ? `Edit: ${initial.name}` : 'Add product'}>
        {id && initial.active && (
          <a href={`/product/${initial.slug}`} target="_blank" rel="noreferrer"
            className="self-center text-sm text-gold hover:underline">View in shop ↗</a>
        )}
      </PageHeader>

      <ErrorBox message={error} />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          {/* Basic details */}
          <Card className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={fieldErrors.name} className="sm:col-span-2">
              <input className={inputClass} value={form.name} onChange={(e) => set('name', e.target.value)} />
            </Field>
            <Field label="Category" error={fieldErrors.categoryId}>
              <select className={inputClass} value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">— choose —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Price (USD)" error={fieldErrors.price}>
              <input className={inputClass} type="number" min="0" step="0.01" placeholder="49.99"
                value={form.price} onChange={(e) => set('price', e.target.value)} />
            </Field>
            <Field label="Stock (pieces available)" error={fieldErrors.stock}
              hint="Goes down automatically when someone orders">
              <input className={inputClass} type="number" min="0" step="1"
                value={form.stock} onChange={(e) => set('stock', e.target.value)} />
            </Field>
            <Field label="Description" error={fieldErrors.description} className="sm:col-span-2">
              <textarea className={inputClass} rows={4} value={form.description}
                onChange={(e) => set('description', e.target.value)} />
            </Field>
          </Card>

          {/* Colours */}
          <Card>
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl">Colours</h2>
              <Button variant="secondary" onClick={addColor}>+ Add colour</Button>
            </div>
            <p className="text-xs text-mulberry/50">Leave empty if there&apos;s no colour choice.</p>
            <div className="mt-3 space-y-2">
              {form.colors.map((c, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="color" value={c.hex} onChange={(e) => updateColor(i, 'hex', e.target.value)}
                    className="h-10 w-12 cursor-pointer rounded border border-gold-light bg-white" title="Pick the colour" />
                  <input className={inputClass} placeholder="Colour name, e.g. Dusty Rose" value={c.name}
                    onChange={(e) => updateColor(i, 'name', e.target.value)} />
                  <button type="button" onClick={() => removeColor(i)} aria-label="Remove colour"
                    className="px-2 text-xl text-mulberry/50 hover:text-red-700">×</button>
                </div>
              ))}
            </div>
            {Object.keys(fieldErrors).some((k) => k.startsWith('colors')) && (
              <p className="mt-2 text-sm text-red-700">Every colour needs a name.</p>
            )}
          </Card>

          {/* Sizes */}
          <Card>
            <h2 className="font-display text-xl">Sizes</h2>
            <p className="text-xs text-mulberry/50">Click to select. None selected = &quot;One size&quot;.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {[...new Set([...COMMON_SIZES, ...form.sizes])].map((s) => (
                <button key={s} type="button" onClick={() => toggleSize(s)}
                  className={`min-w-12 rounded-full border px-4 py-1.5 text-sm ${
                    form.sizes.includes(s) ? 'border-mulberry bg-mulberry text-cream' : 'border-gold-light hover:border-gold'
                  }`}>
                  {s}
                </button>
              ))}
            </div>
            <div className="mt-3 flex max-w-xs gap-2">
              <input className={inputClass} placeholder="Other size, e.g. 52" value={customSize}
                onChange={(e) => setCustomSize(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomSize() } }} />
              <Button variant="secondary" onClick={addCustomSize}>Add</Button>
            </div>
          </Card>
        </div>

        {/* Right column: photo + visibility + save */}
        <div className="space-y-6">
          <Card>
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-xl">Photos</h2>
              <span className="text-xs text-mulberry/50">{form.images.length} / {MAX_PHOTOS}</span>
            </div>

            {/* Main photo, big */}
            <div className="mt-3 aspect-[3/4] overflow-hidden rounded-xl">
              <ProductImage product={{ name: form.name || '?', imageUrl: form.images[0] }} letterClass="text-6xl" />
            </div>

            {/* All photos, small, with buttons */}
            {form.images.length > 0 && (
              <ul className="mt-3 grid grid-cols-3 gap-2">
                {form.images.map((url, i) => (
                  <li key={url} className={`overflow-hidden rounded-lg border-2 ${i === 0 ? 'border-mulberry' : 'border-gold-light'}`}>
                    <div className="relative aspect-[3/4]">
                      <img src={url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
                      {i === 0 && (
                        <span className="absolute left-1 top-1 rounded bg-mulberry px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-cream">Main</span>
                      )}
                    </div>
                    <div className="flex items-center justify-between bg-white px-1 py-0.5 text-sm">
                      <button type="button" aria-label="Move left" disabled={i === 0} onClick={() => movePhoto(i, -1)}
                        className="px-1 hover:text-gold disabled:opacity-25">‹</button>
                      {i !== 0 && (
                        <button type="button" title="Make main photo" onClick={() => makeMain(i)}
                          className="px-1 text-xs hover:text-gold">★</button>
                      )}
                      <button type="button" aria-label="Remove photo" onClick={() => removePhoto(i)}
                        className="px-1 hover:text-red-700">×</button>
                      <button type="button" aria-label="Move right" disabled={i === form.images.length - 1}
                        onClick={() => movePhoto(i, 1)} className="px-1 hover:text-gold disabled:opacity-25">›</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {/* "multiple" = you can pick several photos at once */}
            <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotos} />
            <Button variant="secondary" className="mt-3" disabled={uploading || form.images.length >= MAX_PHOTOS}
              onClick={() => fileInput.current.click()}>
              {uploading ? 'Uploading…' : form.images.length ? '+ Add more photos' : 'Upload photos'}
            </Button>
            <p className="mt-2 text-xs text-mulberry/50">
              You can select several at once. JPG, PNG or WEBP, under 5 MB each. Portrait (3:4) looks best.
              The <strong>main</strong> photo is shown in the shop - use ★ to choose it, ‹ › to reorder.
            </p>
          </Card>

          <Card className="space-y-3">
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-mulberry" checked={form.active}
                onChange={(e) => set('active', e.target.checked)} />
              <span><span className="font-medium">Visible in shop</span>
                <span className="block text-xs text-mulberry/60">Untick to hide it from customers</span></span>
            </label>
            <label className="flex items-start gap-3">
              <input type="checkbox" className="mt-1 h-4 w-4 accent-mulberry" checked={form.featured}
                onChange={(e) => set('featured', e.target.checked)} />
              <span><span className="font-medium">Featured ★</span>
                <span className="block text-xs text-mulberry/60">Will be shown on the home page</span></span>
            </label>
          </Card>

          <Button type="submit" disabled={busy || uploading} className="w-full py-3">
            {busy ? 'Saving…' : id ? 'Save changes' : 'Add product'}
          </Button>
          {id && <Button variant="danger" disabled={busy} onClick={handleDelete} className="w-full">Delete product</Button>}
        </div>
      </div>
    </form>
  )
}
