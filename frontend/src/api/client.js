import axios from 'axios'

// One shared Axios instance for talking to the Spring Boot backend.
// "/api" is forwarded to http://localhost:8080 by the Vite proxy (see vite.config.js).
const api = axios.create({
  baseURL: '/api',
})

// ---------- Login token ("staff badge") kept in the browser ----------
const TOKEN_KEY = 'velora-token'

export function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function setToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token)
    else localStorage.removeItem(TOKEN_KEY)
  } catch {
    /* storage blocked - you'll just need to log in again next time */
  }
}

// Before EVERY request: if we have a token, attach it ("Authorization: Bearer <token>")
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// After every answer: if the backend says 401 (token expired/invalid) -> log out
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config
    if (error.response?.status === 401 && config?.headers?.Authorization && !config._retried) {
      setToken(null)
      window.dispatchEvent(new Event('velora-logout'))
      // Shop pages don't need a login: quietly try again without the old token
      if (!config.url.startsWith('/admin') && !config.url.startsWith('/auth')) {
        config._retried = true
        delete config.headers.Authorization
        return api(config)
      }
    }
    return Promise.reject(error)
  },
)

/** Turns any error into a sentence we can show on screen. */
export function errorMessage(err, fallback = 'Something went wrong. Please try again.') {
  const status = err?.response?.status
  // No answer at all, or 502/503/504 = the backend (kitchen) is closed or restarting
  if (!err?.response || status === 502 || status === 503 || status === 504) {
    return 'Cannot reach the server. Is the backend running? (If you just restarted it, wait a few seconds and refresh.)'
  }
  return err.response.data?.message ?? fallback
}

export default api
