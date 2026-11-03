export function parseDecimal(value) {
  if (value === '' || value == null) return 0
  const normalized = String(value).trim().replace(/\s/g, '').replace(',', '.')
  if (!normalized || normalized === '.') return NaN
  const number = Number(normalized)
  if (!Number.isFinite(number)) return NaN
  return Math.round(number * 100) / 100
}

export function normalizeDiscountInput(value) {
  const cleaned = String(value).replace(/[^\d.,]/g, '')
  const match = cleaned.match(/^(\d*)(?:[.,](\d*))?/)
  if (!match) return ''
  const whole = match[1].slice(0, 3)
  if (!/[.,]/.test(cleaned)) return whole
  return `${whole},${(match[2] || '').slice(0, 2)}`
}

export function formatDecimalComma(value) {
  const number = typeof value === 'number' ? Math.round(value * 100) / 100 : parseDecimal(value)
  if (!Number.isFinite(number)) return ''
  if (Number.isInteger(number)) return String(number)
  return number.toFixed(2).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',')
}

export function formatDirham(amount) {
  const value = Number(amount)
  if (!Number.isFinite(value)) return '0 درهم'
  return `${value.toLocaleString('fr-MA', { maximumFractionDigits: 2 })} درهم`
}

export function getUnitPrice(product) {
  const price = Number(product?.price) || 0
  const discount = Number(product?.discountPercentage) || 0
  if (discount > 0 && discount <= 100) {
    return price * (1 - discount / 100)
  }
  return price
}

export function productPath(product) {
  if (!product) return '/products'
  return `/product/${product.slug || product._id}`
}

export function isVideoUrl(url) {
  return /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url || '')
}
