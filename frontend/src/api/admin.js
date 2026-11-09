import api from './client.js'

// Everything the admin panel asks the backend. All need the admin login token
// (it's attached automatically by api/client.js).

const data = (promise) => promise.then((res) => res.data)

export const getDashboard = () => data(api.get('/admin/dashboard'))

/** period = 'DAY' | 'WEEK' | 'MONTH' */
export const getSalesReport = (period) => data(api.get('/admin/reports/sales', { params: { period } }))

// Orders
export const getOrders = (status) => data(api.get('/admin/orders', { params: status ? { status } : {} }))
export const getAdminOrder = (orderNumber) => data(api.get(`/admin/orders/${orderNumber}`))
export const changeOrderStatus = (orderNumber, status) =>
  data(api.patch(`/admin/orders/${orderNumber}/status`, { status }))
export const deleteOrder = (orderNumber) => api.delete(`/admin/orders/${orderNumber}`)

// Products
export const getAdminProducts = () => data(api.get('/admin/products'))
export const getAdminProduct = (id) => data(api.get(`/admin/products/${id}`))
export const createProduct = (form) => data(api.post('/admin/products', form))
export const updateProduct = (id, form) => data(api.put(`/admin/products/${id}`, form))
export const deleteProduct = (id) => api.delete(`/admin/products/${id}`)

// Customers
export const getCustomers = () => data(api.get('/admin/customers'))
export const setCustomerPassword = (id, newPassword) => api.put(`/admin/customers/${id}/password`, { newPassword })
export const deleteCustomer = (id) => api.delete(`/admin/customers/${id}`)

// Your own admin password (no current password needed)
export const setMyAdminPassword = (newPassword) => api.put('/admin/customers/me/password', { newPassword })

// Categories
export const getAdminCategories = () => data(api.get('/admin/categories'))
export const createCategory = (form) => data(api.post('/admin/categories', form))
export const updateCategory = (id, form) => data(api.put(`/admin/categories/${id}`, form))
export const deleteCategory = (id) => api.delete(`/admin/categories/${id}`)

// Photos: sends the file, gets back its web address, e.g. "/uploads/abc.jpg"
export function uploadPhoto(file) {
  const body = new FormData()
  body.append('file', file)
  return data(api.post('/admin/uploads', body)).then((d) => d.url)
}

// Delivery fees (per area + per city)
export const updateDelivery = (regions, freeDeliveryOver) =>
  data(api.put('/admin/delivery', { regions, freeDeliveryOver }))
export const addDeliveryCity = (city) => data(api.post('/admin/delivery/cities', city))
export const updateDeliveryCity = (id, city) => data(api.put(`/admin/delivery/cities/${id}`, city))
export const deleteDeliveryCity = (id) => api.delete(`/admin/delivery/cities/${id}`)
