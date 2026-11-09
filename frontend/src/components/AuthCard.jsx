/** The centered white box used by the Log in and Sign up pages. */
export default function AuthCard({ title, subtitle, children }) {
  return (
    <section className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-2xl border border-gold-light bg-white/70 p-8">
        <h1 className="text-center font-display text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 text-center text-sm text-mulberry/70">{subtitle}</p>}
        <div className="mt-8">{children}</div>
      </div>
    </section>
  )
}

/** One labelled input with its error message. */
export function AuthField({ label, error, ...inputProps }) {
  return (
    <label className="mb-4 block">
      <span className="text-xs uppercase tracking-wider">{label}</span>
      <input
        {...inputProps}
        className={`mt-1 w-full rounded-xl border bg-white px-4 py-3 outline-none focus:border-gold ${
          error ? 'border-red-400' : 'border-gold-light'
        }`}
      />
      {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  )
}
