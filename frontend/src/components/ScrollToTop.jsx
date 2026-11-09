import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** Jump to the top of the page whenever the page (address) changes. */
export default function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null // shows nothing on screen
}
