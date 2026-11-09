import { useEffect, useState } from 'react'
import { errorMessage } from '../api/client.js'

/**
 * Loads data from the backend and keeps track of loading / error for us.
 *   const { data, error, loading, reload } = useLoad(() => getOrders(status), [status])
 * When anything in "deps" changes, it loads again. reload() loads again on demand.
 */
export default function useLoad(loader, deps = []) {
  const [version, setVersion] = useState(0)
  const [state, setState] = useState({ key: null, data: null, error: null })
  const key = JSON.stringify(deps) + '#' + version

  useEffect(() => {
    let cancelled = false
    loader()
      .then((data) => !cancelled && setState({ key, data, error: null }))
      .catch((err) => !cancelled && setState((s) => ({ key, data: s.data, error: errorMessage(err) })))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  return {
    data: state.data,
    error: state.error,
    loading: state.key !== key,
    reload: () => setVersion((v) => v + 1),
  }
}
