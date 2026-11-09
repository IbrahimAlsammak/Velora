import { useState } from 'react'
import { createCategory, deleteCategory, getAdminCategories, updateCategory } from '../../api/admin.js'
import { errorMessage } from '../../api/client.js'
import { inputClass } from '../../components/admin/styles.js'
import { Button, Card, ErrorBox, Field, Loading, PageHeader } from '../../components/admin/ui.jsx'
import useLoad from '../../hooks/useLoad.js'

export default function Categories() {
  const { data: categories, error, loading, reload } = useLoad(getAdminCategories)
  const [editing, setEditing] = useState(null) // the category being edited, or {} for a new one
  const [actionError, setActionError] = useState(null)

  async function handleDelete(c) {
    if (!window.confirm(`Delete the category "${c.name}"?`)) return
    setActionError(null)
    try {
      await deleteCategory(c.id)
      reload()
    } catch (err) {
      setActionError(errorMessage(err))
    }
  }

  return (
    <>
      <PageHeader title="Categories" subtitle="The groups customers filter by in the shop">
        <Button onClick={() => setEditing({})}>+ Add category</Button>
      </PageHeader>

      <ErrorBox message={error || actionError} />

      {editing && (
        <CategoryEditor key={editing.id ?? 'new'} category={editing}
          onDone={() => { setEditing(null); reload() }} onCancel={() => setEditing(null)} />
      )}

      {loading && !categories && <Loading />}
      {categories && (
        <Card className="p-0">
          <ul className="divide-y divide-gold-light/50">
            {categories.map((c) => (
              <li key={c.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="mr-auto">
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-mulberry/60">{c.description || 'No description'}</p>
                </div>
                <span className="text-sm text-mulberry/60">{c.productCount} products</span>
                <Button variant="secondary" onClick={() => setEditing(c)}>Edit</Button>
                <Button variant="danger" onClick={() => handleDelete(c)}>Delete</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  )
}

function CategoryEditor({ category, onDone, onCancel }) {
  const [name, setName] = useState(category.name ?? '')
  const [description, setDescription] = useState(category.description ?? '')
  const [fieldErrors, setFieldErrors] = useState({})
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setFieldErrors({})
    try {
      if (category.id) await updateCategory(category.id, { name, description })
      else await createCategory({ name, description })
      onDone()
    } catch (err) {
      setFieldErrors(err.response?.data?.fields ?? {})
      setError(errorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Card className="mb-6 border-gold">
      <form onSubmit={handleSave} noValidate className="grid gap-4 sm:grid-cols-[1fr_2fr_auto] sm:items-end">
        <Field label={category.id ? 'Name' : 'New category name'} error={fieldErrors.name}>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} autoFocus />
        </Field>
        <Field label="Description (shown on the shop page)" error={fieldErrors.description}>
          <input className={inputClass} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" disabled={busy}>{busy ? 'Saving…' : 'Save'}</Button>
          <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        </div>
      </form>
      <ErrorBox message={error && !Object.keys(fieldErrors).length ? error : null} />
    </Card>
  )
}
