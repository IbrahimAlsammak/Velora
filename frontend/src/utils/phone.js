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
