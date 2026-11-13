import { useRef, useState } from 'react'
import { getAdminCategories, saveSlides, uploadPhoto } from '../../api/admin.js'
import { getSlides } from '../../api/catalog.js'
import { errorMessage } from '../../api/client.js'
import { inputClass } from '../../components/admin/styles.js'
import { Button, Card, ErrorBox, Loading, PageHeader } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'

const MAX_SLIDES = 10

/** Admin → Home banner: the photos of the slideshow in the arch on the home page. */
export default function HomeBanner() {
  const slides = useLoad(getSlides)
  const categories = useLoad(getAdminCategories)

  if (slides.loading || categories.loading) return <Loading />
  if (slides.error || categories.error) return <ErrorBox message={slides.error || categories.error} />
  return <Editor initial={slides.data} categories={categories.data} />
}

function Editor({ initial, categories }) {
  const fileInput = useRef(null)
  const [slides, setSlides] = useState(initial.map((s) => ({ ...s, caption: s.caption ?? '', link: s.link ?? '' })))
  const [uploading, setUploading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [saved, setSaved] = useState(false)

  // Where a photo can lead when clicked
  const linkOptions = [
    { value: '', label: 'Nowhere (just a photo)' },
    { value: '/shop', label: 'Shop - all products' },
    ...categories.map((c) => ({ value: `/shop?category=${c.slug}`, label: `Shop - ${c.name}` })),
  ]

  const change = (next) => {
    setSlides(next)
    setSaved(false)
  }
  const update = (index, field, value) => change(slides.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  const remove = (index) => change(slides.filter((_, i) => i !== index))
  function move(index, step) {
    const target = index + step
    if (target < 0 || target >= slides.length) return
    const next = [...slides]
    ;[next[index], next[target]] = [next[target], next[index]]
    change(next)
  }

  async function handlePhotos(e) {
    const files = [...(e.target.files ?? [])]
    e.target.value = ''
    const room = MAX_SLIDES - slides.length
    if (files.length > room) {
      setError(`You can add ${room} more photo(s) - up to ${MAX_SLIDES}.`)
      files.splice(room)
    } else {
      setError(null)
    }
    setUploading(true)
    for (const file of files) {
      try {
        const url = await uploadPhoto(file)
        setSlides((s) => [...s, { imageUrl: url, caption: '', link: '' }])
        setSaved(false)
      } catch (err) {
        setError(`${file.name}: ${errorMessage(err)}`)
      }
    }
    setUploading(false)
  }

  async function handleSave() {
    setBusy(true)
    setError(null)
    try {
      const result = await saveSlides(slides)
      setSlides(result.map((s) => ({ ...s, caption: s.caption ?? '', link: s.link ?? '' })))
      setSaved(true)
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <PageHeader title="Home banner" subtitle="The photos that change by themselves in the arch on the home page">
        <a href="/" target="_blank" rel="noreferrer" className="self-center text-sm text-gold hover:underline">View home page ↗</a>
      </PageHeader>
      <ErrorBox message={error} />

      <Card className="mb-6 text-sm text-mulberry/70">
        Upload up to {MAX_SLIDES} photos. <strong>Portrait</strong> photos (taller than wide, 3:4) fit the arch best.
        The first photo shows first; use ‹ › to change the order. Nothing changes on the website until you press <strong>Save</strong>.
        {slides.length === 0 && ' With no photos here, the banner shows your featured products instead.'}
      </Card>

      {slides.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {slides.map((s, i) => (
            <Card key={s.imageUrl} className="flex flex-col gap-3">
              <div className="relative aspect-3/4 overflow-hidden rounded-t-full border-2 border-gold/60">
                <img src={s.imageUrl} alt={`Banner photo ${i + 1}`} className="h-full w-full object-cover" />
                {s.caption && (
                  <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-mulberry/70 to-transparent px-3 pb-4 pt-8 text-center font-display text-lg text-cream">
                    {s.caption}
                  </span>
                )}
                <span className="absolute left-1/2 top-3 -translate-x-1/2 rounded-full bg-mulberry px-2.5 py-0.5 text-xs text-cream">{i + 1}</span>
              </div>
              <label className="text-xs uppercase tracking-wider text-mulberry/60">
                Text on the photo (optional)
                <input className={`${inputClass} mt-1 normal-case tracking-normal`} maxLength={80} placeholder="e.g. New abayas"
                  value={s.caption} onChange={(e) => update(i, 'caption', e.target.value)} />
              </label>
              <label className="text-xs uppercase tracking-wider text-mulberry/60">
                When clicked, go to
                <select className={`${inputClass} mt-1 normal-case tracking-normal`} value={s.link} onChange={(e) => update(i, 'link', e.target.value)}>
                  {linkOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </label>
              <div className="flex items-center justify-between text-sm">
                <span>
                  <button type="button" aria-label="Move earlier" disabled={i === 0} onClick={() => move(i, -1)}
                    className="px-2 text-lg hover:text-gold disabled:opacity-25">‹</button>
                  <button type="button" aria-label="Move later" disabled={i === slides.length - 1} onClick={() => move(i, 1)}
                    className="px-2 text-lg hover:text-gold disabled:opacity-25">›</button>
                </span>
                <button type="button" onClick={() => remove(i)} className="text-red-700 hover:underline">Remove</button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <input ref={fileInput} type="file" multiple accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotos} />
        <Button variant="secondary" disabled={uploading || slides.length >= MAX_SLIDES} onClick={() => fileInput.current.click()}>
          {uploading ? 'Uploading…' : slides.length ? '+ Add photos' : 'Upload photos'}
        </Button>
        <Button disabled={busy || uploading} onClick={handleSave}>{busy ? 'Saving…' : 'Save'}</Button>
        {saved && <span className="text-sm text-green-800">✓ Saved - the home page shows it now</span>}
      </div>
    </>
  )
}
