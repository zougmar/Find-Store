/**
 * Skeleton placeholder for ProductCard - matches layout for loading states
 */
const ProductCardSkeleton = () => {
  return (
    <div className="block animate-pulse">
      <div className="relative">
        {/* Image */}
        <div className="w-full h-48 sm:h-56 md:h-64 rounded-xl md:rounded-2xl bg-gray-200" />
        {/* Title lines */}
        <div className="mt-4 space-y-2">
          <div className="h-4 bg-gray-200 rounded-lg w-full" />
          <div className="h-4 bg-gray-200 rounded-lg w-3/4" />
        </div>
        {/* Price */}
        <div className="mt-3 h-5 bg-gray-200 rounded-lg w-1/3" />
        {/* Button */}
        <div className="mt-4 h-11 bg-gray-200 rounded-xl w-full" />
      </div>
    </div>
  )
}

export default ProductCardSkeleton
