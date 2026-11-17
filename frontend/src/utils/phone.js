/**
 * Lebanese phone numbers are saved as "+9613123456" / "+96176569913".
 * These helpers make them nice to read and easy to call or WhatsApp.
 */

/** "+9613123456" -> "+961 3 123 456",  "+96176569913" -> "+961 76 569 913" */
export function formatPhone(phone) {
  if (!phone) return ''
  const m = phone.match(/^\+961(\d{1,2})(\d{3})(\d{3})$/)
  return m ? `+961 ${m[1]} ${m[2]} ${m[3]}` : phone
}

/** Link that opens a WhatsApp chat with this number. */
export function whatsappUrl(phone) {
  return `https://wa.me/${(phone ?? '').replace(/[^0-9]/g, '')}`
}

/** Link that starts a phone call (on phones). */
export function callUrl(phone) {
  return `tel:${(phone ?? '').replace(/\s/g, '')}`
}

/**
 * A saved number shown the way people write it in Lebanon (for filling forms):
 * "+96171999999" -> "71 999 999",  "+9613123456" -> "03 123 456"
 */
export function localPhone(phone) {
  const m = (phone ?? '').match(/^\+961(\d{7,8})$/)
  if (!m) return phone ?? ''
  return typePhone(m[1].length === 7 ? `0${m[1]}` : m[1])
}

/**
 * Adds the spaces while the customer types: "71999999" -> "71 999 999", "03123456" -> "03 123 456",
 * "+96171999999" -> "+961 71 999 999". Letters are ignored. Use it in a phone box's onChange.
 */
export function typePhone(input) {
  const raw = (input ?? '').trim()
  let digits = raw.replace(/\D/g, '')
  let prefix = ''
  if (raw.startsWith('+')) {
    if (!digits.startsWith('961')) return '+' + digits.slice(0, 12) // still typing "+96", or not a Lebanese number
    prefix = '+961 '
    digits = digits.slice(3)
  } else if (digits.startsWith('00961')) {
    prefix = '+961 '
    digits = digits.slice(5)
  } else if (digits.startsWith('961') && digits.length > 8) {
    prefix = '+961 '
    digits = digits.slice(3)
  }
  digits = digits.slice(0, digits.startsWith('0') ? 9 : 8) // a Lebanese number is never longer
  // first group: "3" (3 123 456), "071" (071 999 999) or two digits (71 / 03)
  const head = digits.startsWith('3') ? 1 : digits.startsWith('0') && digits.length === 9 ? 3 : 2
  const parts = [digits.slice(0, head), digits.slice(head, head + 3), digits.slice(head + 3)].filter(Boolean)
  return (prefix + parts.join(' ')).trimEnd() // no space at the end, so Backspace always works
}
