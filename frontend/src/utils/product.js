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
