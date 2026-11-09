import { STORE } from '../config/store.js'

/** The ways to pay, as shown to customers. The keys match the backend (PaymentMethod.java). */
export const PAYMENT_METHODS = {
  CASH_ON_DELIVERY: {
    label: 'Cash on delivery',
    description: 'Pay in cash when your order arrives.',
  },
  WHISH_TRANSFER: {
    label: 'Whish transfer',
    description: 'Send the amount from your Whish app. We confirm your order once it arrives.',
  },
}

/** Only offer Whish if the store has filled in its Whish number (config/store.js). */
export function availablePaymentMethods() {
  return Object.keys(PAYMENT_METHODS).filter((key) => key !== 'WHISH_TRANSFER' || STORE.whishNumber)
}

export const paymentLabel = (key) => PAYMENT_METHODS[key]?.label ?? key
