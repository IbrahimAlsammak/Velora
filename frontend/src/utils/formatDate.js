const dateTime = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23', // always 24-hour time: 00:00 - 23:59 (never AM/PM)
})

/** "2026-11-09T14:30:00Z" -> "9 Nov 2026, 16:30" (in your computer's time zone) */
export default function formatDate(isoString) {
  return dateTime.format(new Date(isoString))
}
