import { createContext, useContext } from 'react'

/** The shared "box" holding the shopping bag. Filled by <CartProvider> in CartContext.jsx */
export const CartContext = createContext(null)

/** Use inside any component: const { count, addItem } = useCart() */
export function useCart() {
  const cart = useContext(CartContext)
  if (!cart) throw new Error('useCart must be used inside <CartProvider>')
  return cart
}
