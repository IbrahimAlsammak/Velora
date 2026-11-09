import { useEffect, useMemo, useState } from 'react'
import { CartContext } from './useCart.js'

/**
 * The shopping bag, shared by every page.
 * "Context" = a box of data any component can open, without passing it through every page.
 * Components read it with useCart() from ./useCart.js
 * The bag is saved in the browser (localStorage), so it survives a page refresh.
 */
const STORAGE_KEY = 'velora-cart'

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY))
    return Array.isArray(saved) ? saved : []
  } catch {
    return [] // private window / blocked storage -> just start with an empty bag
  }
}

/** Same product in a different colour or size = a different line in the bag. */
const lineKey = (productId, color, size) => `${productId}|${color ?? ''}|${size ?? ''}`

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCart)

  // Save to the browser every time the bag changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage not available - the bag still works until the page is closed */
    }
  }, [items])

  const value = useMemo(() => {
    function addItem(product, { color, size, quantity }) {
      const key = lineKey(product.id, color, size)
      setItems((current) => {
        const existing = current.find((i) => i.key === key)
        if (existing) {
          return current.map((i) => (i.key === key ? { ...i, quantity: i.quantity + quantity } : i))
        }
        return [
          ...current,
          {
            key,
            productId: product.id,
            slug: product.slug,
            name: product.name,
            price: product.price,
            imageUrl: product.imageUrl,
            color,
            size,
            quantity,
          },
        ]
      })
    }

    function updateQuantity(key, quantity) {
      setItems((current) =>
        quantity <= 0 ? current.filter((i) => i.key !== key) : current.map((i) => (i.key === key ? { ...i, quantity } : i)),
      )
    }

    const removeItem = (key) => setItems((current) => current.filter((i) => i.key !== key))
    const clear = () => setItems([])

    const count = items.reduce((sum, i) => sum + i.quantity, 0)
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0)

    return { items, count, subtotal, addItem, updateQuantity, removeItem, clear }
  }, [items])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

