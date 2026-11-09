/** How an order's status is shown to customers. */
export const ORDER_STATUS = {
  PENDING: { label: 'Received', text: 'Waiting for confirmation', step: 0, tone: 'bg-amber-50 text-amber-800 border-amber-200' },
  PAID: { label: 'Confirmed', text: 'We are preparing your order', step: 1, tone: 'bg-sky-50 text-sky-800 border-sky-200' },
  SHIPPED: { label: 'On its way', text: 'Out for delivery', step: 2, tone: 'bg-violet-50 text-violet-800 border-violet-200' },
  DELIVERED: { label: 'Delivered', text: 'Delivered - enjoy!', step: 3, tone: 'bg-green-50 text-green-800 border-green-200' },
  CANCELLED: { label: 'Cancelled', text: 'This order was cancelled', step: -1, tone: 'bg-gray-50 text-gray-500 border-gray-200' },
}

/** The 4 steps of a delivery, in order. */
export const ORDER_STEPS = ['Received', 'Confirmed', 'On its way', 'Delivered']

/** Still on its way to the customer? */
export const isActiveOrder = (o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED'
