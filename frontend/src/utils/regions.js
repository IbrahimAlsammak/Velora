/** Areas of Lebanon. The keys match the backend (Region.java). */
export const REGIONS = {
  BEIRUT: 'Beirut',
  MOUNT_LEBANON: 'Mount Lebanon',
  NORTH: 'North',
  AKKAR: 'Akkar',
  SOUTH: 'South',
  NABATIEH: 'Nabatieh',
  BEKAA: 'Bekaa',
  BAALBEK_HERMEL: 'Baalbek-Hermel',
}

export const regionLabel = (key) => REGIONS[key] ?? key

/** "Jounieh, Mount Lebanon" - or the old "City, Country" for orders placed before areas existed. */
export const placeLabel = (order) => `${order.city}, ${order.region ? regionLabel(order.region) : order.country}`
