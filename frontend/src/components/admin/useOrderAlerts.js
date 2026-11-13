import { useEffect, useState } from 'react'
import { getOrderAlerts } from '../../api/admin.js'

const CHECK_EVERY_MS = 30000 // ask the backend every 30 seconds

/**
 * How many orders are waiting (PENDING) - shown as the red number next to "Orders"
 * and in the tab name. New-order alerts go to your phone through Telegram (backend).
 *   const pending = useOrderAlerts()
 */
export default function useOrderAlerts() {
  const [pending, setPending] = useState(0)

  useEffect(() => {
    let stopped = false

    async function check() {
      try {
        const { pendingOrders } = await getOrderAlerts()
        if (!stopped) setPending(pendingOrders)
      } catch {
        /* backend not reachable for a moment - try again at the next check */
      }
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

  return pending
}
