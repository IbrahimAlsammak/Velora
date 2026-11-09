/** Small building blocks shared by the admin pages, so they all look the same. */

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-4xl font-semibold">{title}</h1>
        {subtitle && <p className="mt-1 text-mulberry/60">{subtitle}</p>}
      </div>
      {children && <div className="flex gap-3">{children}</div>}
    </div>
  )
}

export function Card({ className = '', children }) {
  return <div className={`rounded-2xl border border-gold-light/70 bg-white/70 p-5 ${className}`}>{children}</div>
}

const STATUS_STYLES = {
  PENDING: 'bg-amber-100 text-amber-800',
  PAID: 'bg-sky-100 text-sky-800',
  SHIPPED: 'bg-indigo-100 text-indigo-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-stone-200 text-stone-600',
}

export function StatusBadge({ status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wider ${STATUS_STYLES[status] ?? ''}`}>
      {status.toLowerCase()}
    </span>
  )
}

export function Button({ variant = 'primary', className = '', ...props }) {
  const styles = {
    primary: 'bg-mulberry text-cream hover:bg-gold',
    secondary: 'border border-gold-light text-mulberry hover:border-gold hover:text-gold',
    danger: 'border border-red-300 text-red-700 hover:bg-red-50',
  }
  return (
    <button
      type="button"
      {...props}
      className={`rounded-full px-5 py-2 text-sm tracking-wider transition disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]} ${className}`}
    />
  )
}

export function Loading() {
  return <p className="py-10 text-center text-gold">Loading…</p>
}

export function ErrorBox({ message }) {
  return message ? <p className="my-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p> : null
}

/** A labelled form field. Pass an <input>, <select> or <textarea> as children. */
export function Field({ label, error, hint, className = '', children }) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-medium uppercase tracking-wider text-mulberry/80">{label}</span>
      <div className="mt-1">{children}</div>
      {hint && !error && <span className="mt-1 block text-xs text-mulberry/50">{hint}</span>}
      {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  )
}
