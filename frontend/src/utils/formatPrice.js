// Store currency settings - change these in ONE place and every price on the site updates.
const CURRENCY = 'USD'
const LOCALE = 'en-US'

const formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY })

/** 14.99 -> "$14.99" */
export default function formatPrice(amount) {
  return formatter.format(amount)
}
