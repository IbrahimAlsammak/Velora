/** Where an order came from. The keys match the backend (OrderSource.java). */
export const ORDER_SOURCES = {
  WEBSITE: { label: 'Website', icon: '🌐' },
  WHATSAPP: { label: 'WhatsApp', icon: '💬' },
  INSTAGRAM: { label: 'Instagram', icon: '📷' },
  OTHER: { label: 'Other', icon: '🤝' },
}

/** true = you typed this order in yourself (sold in a chat) */
export const isManual = (order) => order.source && order.source !== 'WEBSITE'
