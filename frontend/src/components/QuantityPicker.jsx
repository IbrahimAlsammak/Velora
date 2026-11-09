/** The "−  2  +" control. Used on the product page and in the bag. */
export default function QuantityPicker({ value, onChange, min = 1, max = 10, small = false }) {
  const pad = small ? 'px-3 py-1.5' : 'px-4 py-3'
  return (
    <div className="inline-flex items-center rounded-full border border-gold-light">
      <button type="button" aria-label="Less" className={`${pad} hover:text-gold disabled:opacity-30`}
        disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
      <span className="w-8 text-center">{value}</span>
      <button type="button" aria-label="More" className={`${pad} hover:text-gold disabled:opacity-30`}
        disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
    </div>
  )
}
