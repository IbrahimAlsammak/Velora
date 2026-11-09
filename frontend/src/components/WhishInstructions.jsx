import { useState } from 'react'
import { STORE } from '../config/store.js'
import formatPrice from '../utils/formatPrice.js'

/** "Send $X to our Whish number with your order number in the note" - shown after ordering. */
export default function WhishInstructions({ amount, orderNumber }) {
  return (
    <div className="rounded-2xl border-2 border-gold bg-white/80 p-6 text-left">
      <p className="text-xs uppercase tracking-[0.25em] text-gold">Next step: pay with Whish</p>
      <h2 className="mt-2 font-display text-3xl">Send {formatPrice(amount)}</h2>

      <ol className="mt-5 space-y-4 text-sm">
        <Step n="1">
          Open your <strong>Whish</strong> app and send <strong>{formatPrice(amount)}</strong> to:
          <CopyLine value={STORE.whishNumber} />
          {STORE.whishName && <span className="block text-mulberry/60">Account name: {STORE.whishName}</span>}
        </Step>
        <Step n="2">
          In the note, write your order number:
          <CopyLine value={orderNumber} />
        </Step>
        <Step n="3">
          That&apos;s it. We&apos;ll confirm your order as soon as we receive the payment.
        </Step>
      </ol>
    </div>
  )
}

function Step({ n, children }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mulberry text-xs text-cream">{n}</span>
      <div className="flex-1">{children}</div>
    </li>
  )
}

/** A value with a "Copy" button, so customers don't have to type it. */
function CopyLine({ value }) {
  const [copied, setCopied] = useState(false)

  function copy() {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }).catch(() => {})
  }

  return (
    <span className="mt-1.5 flex items-center justify-between gap-3 rounded-lg border border-gold-light bg-cream px-3 py-2">
      <span className="font-medium tracking-wider">{value}</span>
      <button type="button" onClick={copy} className="text-xs uppercase tracking-wider text-gold hover:underline">
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </span>
  )
}
