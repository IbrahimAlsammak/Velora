import { useCallback, useEffect, useState } from 'react'
import { getOrderAlerts } from '../../api/admin.js'

const CHECK_EVERY_MS = 15000 // ask the backend every 15 seconds

/** Asks the backend how many orders are waiting. null = backend not reachable right now. */
async function loadPending() {
  try {
    return (await getOrderAlerts()).pendingOrders
  } catch {
    return null // try again at the next check
  }
}

/**
 * How many orders are waiting (PENDING) - shown as the red number next to "Orders"
 * and in the tab name. New-order alerts go to your phone through Telegram (backend).
 *   const { pending, refresh } = useOrderAlerts()
 *   refresh() -> check right now (e.g. just after you changed an order's status)
 */
export default function useOrderAlerts() {
  const [pending, setPending] = useState(0)

  // Check right now - called by the order page after you change a status
  const refresh = useCallback(async () => {
    const n = await loadPending()
    if (n !== null) setPending(n)
  }, [])

  useEffect(() => {
    let stopped = false
    async function check() {
      const n = await loadPending()
      if (!stopped && n !== null) setPending(n)
    }

    check()
    const timer = setInterval(check, CHECK_EVERY_MS)
    // Chrome may put a background tab to sleep - check straight away when you come back to it
    const checkWhenVisible = () => document.visibilityState === 'visible' && check()
    document.addEventListener('visibilitychange', checkWhenVisible)
    return () => {
      stopped = true
      clearInterval(timer)
      document.removeEventListener('visibilitychange', checkWhenVisible)
    }
  }, [])

  return { pending, refresh }
}
