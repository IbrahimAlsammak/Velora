import { useCallback, useEffect, useState } from 'react'
import { getOrderAlerts } from '../../api/admin.js'

const CHECK_EVERY_MS = 15000 // ask the backend every 15 seconds

/**
 * How many orders are waiting (PENDING) - shown as the red number next to "Orders"
 * and in the tab name. New-order alerts go to your phone through Telegram (backend).
 *   const { pending, refresh } = useOrderAlerts()
 *   refresh() -> check right now (e.g. just after you changed an order's status)
 */
export default function useOrderAlerts() {
  const [pending, setPending] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const { pendingOrders } = await getOrderAlerts()
      setPending(pendingOrders)
    } catch {
      /* backend not reachable for a moment - try again at the next check */
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, CHECK_EVERY_MS)
    // Chrome may put a background tab to sleep - check straight away when you come back to it
    const checkWhenVisible = () => document.visibilityState === 'visible' && refresh()
    document.addEventListener('visibilitychange', checkWhenVisible)
    return () => {
      clearInterval(timer)
      document.removeEventListener('visibilitychange', checkWhenVisible)
    }
  }, [refresh])

  return { pending, refresh }
}
