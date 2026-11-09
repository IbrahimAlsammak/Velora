import api from './client.js'

// The logged-in customer's own account.

export const getMyOrders = () => api.get('/account/orders').then((res) => res.data)

/** Customers send { fullName, phone }, the admin sends { fullName, email }. Returns the updated user. */
export const updateProfile = (details) => api.put('/account/profile', details).then((res) => res.data)

export const changePassword = (currentPassword, newPassword) =>
  api.post('/account/password', { currentPassword, newPassword })

