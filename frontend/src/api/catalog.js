import api from './client.js'

// All the ways the website asks the backend for catalog data.

/** Everything for the home page: featured, new arrivals, category tiles. */
export async function getHome() {
  const res = await api.get('/home')
  return res.data
}

/** Delivery prices per city (set by the admin), used at checkout. */
export async function getDelivery() {
  const res = await api.get('/delivery')
  return res.data
}

/** The home page banner photos (chosen in Admin → Home banner). */
export async function getSlides() {
  const res = await api.get('/store/slides')
  return res.data
}

/** Is the shop open, or closed for maintenance? */
export async function getStoreStatus() {
  const res = await api.get('/store/status')
  return res.data
}

export async function getCategories() {
  const res = await api.get('/categories')
  return res.data
}

/** categorySlug is optional: leave it empty to get every product. */
export async function getProducts(categorySlug) {
  const res = await api.get('/products', { params: categorySlug ? { category: categorySlug } : {} })
  return res.data
}

export async function getProduct(slug) {
  const res = await api.get(`/products/${slug}`)
  return res.data
}
