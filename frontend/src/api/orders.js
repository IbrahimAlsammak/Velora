import api from './client.js'

/** Send the checkout form + bag to the backend. Returns the saved order. */
export async function placeOrder(order) {
  const res = await api.post('/orders', order)
  return res.data
}

export async function getOrder(orderNumber) {
  const res = await api.get(`/orders/${orderNumber}`)
  return res.data
}
