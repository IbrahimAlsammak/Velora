import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getOrderAlerts } from '../../api/admin.js'
import formatPrice from '../../utils/formatPrice.js'

const CHECK_EVERY_MS = 30000 // ask the backend every 30 seconds

/** Can this browser show pop-up notifications at all? */
const canNotify = typeof window !== 'undefined' && 'Notification' in window

/**
 * Watches for new orders while the admin panel is open.
 * New order -> a "ding" sound + a pop-up notification (if allowed) + the waiting count goes up.
 *   const alerts = useOrderAlerts()
 *   alerts.pending      -> how many orders are waiting (PENDING)
 *   alerts.permission   -> 'default' (not asked yet) | 'granted' | 'denied' | 'unsupported'
 *   alerts.enable()     -> asks the browser "Allow notifications?"
 *   alerts.test()       -> plays a test alert, so you can see and hear it
 */
export default function useOrderAlerts() {
  const navigate = useNavigate()
  const [pending, setPending] = useState(0)
  const [permission, setPermission] = useState(canNotify ? Notification.permission : 'unsupported')
  // The newest order we already know about. null = first check not done yet
  // (orders that came while the panel was closed don't ding - they're in the waiting count).
  const newestSeen = useRef(null)

  const alertFor = useCallback(
    (title, body, link, tag = link) => {
      playDing()
      if (canNotify && Notification.permission === 'granted') {
        const n = new Notification(title, { body, tag }) // tag = the same order never shows twice
        n.onclick = () => {
          window.focus() // bring the admin tab to the front
          navigate(link)
          n.close()
        }
      }
    },
    [navigate],
  )

  useEffect(() => {
    let stopped = false

    async function check() {
      try {
        const { pendingOrders, newestOrders } = await getOrderAlerts()
        if (stopped) return
        setPending(pendingOrders)

        const newestTime = Math.max(0, ...newestOrders.map((o) => Date.parse(o.createdAt)))
        if (newestSeen.current !== null) {
          const fresh = newestOrders.filter((o) => Date.parse(o.createdAt) > newestSeen.current).reverse() // oldest first
          fresh.forEach((o) =>
            alertFor(
              `🛍️ New order ${o.orderNumber}`,
              `${o.customerName} · ${o.itemCount} item${o.itemCount === 1 ? '' : 's'} · ${formatPrice(o.total)}`,
              `/admin/orders/${o.orderNumber}`,
            ),
          )
        }
        newestSeen.current = Math.max(newestSeen.current ?? 0, newestTime)
      } catch {
        /* backend not reachable for a moment - try again at the next check */
      }
    }

    check()
    const timer = setInterval(check, CHECK_EVERY_MS)
    return () => {
      stopped = true
      clearInterval(timer)
    }
  }, [alertFor])

  async function enable() {
    unlockSound()
    if (!canNotify) return
    setPermission(await Notification.requestPermission())
  }

  function test() {
    unlockSound()
    // a new tag each time, so every test shows a fresh pop-up (not silently replacing the last one)
    alertFor('🛍️ New order (test)', 'This is how a new order will look · $59.98', '/admin/orders', `test-${Date.now()}`)
  }

  return { pending, permission, enable, test }
}

// ---------- The "ding" sound, made by the browser (no sound file needed) ----------
let audio = null

/** Browsers only allow sound after you've clicked something on the page - this prepares it. */
function unlockSound() {
  try {
    audio ??= new AudioContext()
    if (audio.state === 'suspended') audio.resume()
  } catch {
    /* sound not available in this browser */
  }
}

/** Two soft notes, like a shop doorbell. */
function playDing() {
  try {
    unlockSound()
    const start = audio.currentTime
    ;[880, 1320].forEach((frequency, i) => {
      const note = audio.createOscillator()
      const volume = audio.createGain()
      note.type = 'sine'
      note.frequency.value = frequency
      const t = start + i * 0.18
      volume.gain.setValueAtTime(0.0001, t)
      volume.gain.exponentialRampToValueAtTime(0.3, t + 0.02)
      volume.gain.exponentialRampToValueAtTime(0.0001, t + 0.6)
      note.connect(volume).connect(audio.destination)
      note.start(t)
      note.stop(t + 0.65)
    })
  } catch {
    /* no sound - the pop-up and the red number still work */
  }
}
