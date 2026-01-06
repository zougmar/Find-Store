import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import api from '../utils/api'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'
import toast from 'react-hot-toast'
import { formatCurrency } from '../utils/currency'

const Products = () => {
  const { t, isRTL } = useLanguage()
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState([])
  const [productsByCategory, setProductsByCategory] = useState({})
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [categoryPages, setCategoryPages] = useState({}) // { category: currentPage }
  const [visibleSections, setVisibleSections] = useState(new Set())
  const searchTimeoutRef = useRef(null)
  const sectionRefs = useRef({})
  const productsPerPage = 9 // 3 columns x 3 rows
  
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || 'all',
    subcategory: searchParams.get('subcategory') || 'all',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    minRating: searchParams.get('minRating') || '',
    search: searchParams.get('search') || '',
    inStock: searchParams.get('inStock') || 'all',
    sortBy: searchParams.get('sortBy') || 'newest'
  })

  // Get price range from products
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 })

  useEffect(() => {
    fetchCategories()
  }, [])

  // Intersection Observer for fade-in animations
  useEffect(() => {
    const observers = []
    
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    }

    const observerCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleSections(prev => new Set([...prev, entry.target.id]))
        }
      })
    }

    // Observe all category sections
    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) {
        const observer = new IntersectionObserver(observerCallback, observerOptions)
        observer.observe(ref)
        observers.push(observer)
      }
    })

    return () => {
      observers.forEach(observer => observer.disconnect())
    }
  }, [productsByCategory])

  // Fetch subcategories when category changes
  useEffect(() => {
    if (filters.category && filters.category !== 'all') {
      fetchSubcategories(filters.category)
    } else {
      setSubcategories([])
      setFilters(prev => ({ ...prev, subcategory: 'all' }))
    }
  }, [filters.category])

  // Update filters when URL params change
  useEffect(() => {
    const categoryFromUrl = searchParams.get('category')
    const subcategoryFromUrl = searchParams.get('subcategory')
    const searchFromUrl = searchParams.get('search')
    const minPriceFromUrl = searchParams.get('minPrice')
    const maxPriceFromUrl = searchParams.get('maxPrice')
    const minRatingFromUrl = searchParams.get('minRating')
    const inStockFromUrl = searchParams.get('inStock')
    const sortByFromUrl = searchParams.get('sortBy')
    
    setFilters(prev => ({
      ...prev,
      category: categoryFromUrl || 'all',
      subcategory: subcategoryFromUrl || 'all',
      search: searchFromUrl || '',
      minPrice: minPriceFromUrl || '',
      maxPrice: maxPriceFromUrl || '',
      minRating: minRatingFromUrl || '',
      inStock: inStockFromUrl || 'all',
      sortBy: sortByFromUrl || 'newest'
    }))
    
    setSearchInput(searchFromUrl || '')
  }, [searchParams])

  useEffect(() => {
    fetchProducts()
  }, [filters])

  // Get price range from products
  useEffect(() => {
    if (products.length > 0) {
      const prices = products.map(p => p.price)
      setPriceRange({
        min: Math.min(...prices),
        max: Math.max(...prices)
      })
    }
  }, [products])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories')
      setCategories(res.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories')
    }
  }

  const fetchSubcategories = async (category) => {
    try {
      const res = await api.get(`/products/subcategories?category=${encodeURIComponent(category)}`)
      setSubcategories(res.data || [])
    } catch (error) {
      console.error('Error fetching subcategories:', error)
      setSubcategories([])
    }
  }

  const fetchProducts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.category && filters.category !== 'all') params.append('category', filters.category)
      if (filters.subcategory && filters.subcategory !== 'all') params.append('subcategory', filters.subcategory)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)
      if (filters.minRating) params.append('minRating', filters.minRating)
      if (filters.search) params.append('search', filters.search)
      if (filters.sortBy) params.append('sortBy', filters.sortBy)

      const queryString = params.toString()
      const url = queryString ? `/products?${queryString}` : '/products'
      
      const res = await api.get(url)
      
      let filteredProducts = Array.isArray(res.data) ? res.data : []
      
      // Client-side filter for stock availability
      if (filters.inStock === 'inStock') {
        filteredProducts = filteredProducts.filter(p => p.stock > 0)
      } else if (filters.inStock === 'outOfStock') {
        filteredProducts = filteredProducts.filter(p => p.stock <= 0)
      }
      
      setProducts(filteredProducts)
      
      // Group products by category
      const grouped = {}
      filteredProducts.forEach(product => {
        const category = product.category || 'Uncategorized'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(product)
      })
      
      setProductsByCategory(grouped)
      
      // Reset pagination when filters change
      setCategoryPages({})
    } catch (error) {
      console.error('Error fetching products:', error)
      
      if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        toast.error('Cannot connect to server. Make sure the backend is running on port 5000')
      } else {
        toast.error(error.response?.data?.message || 'Failed to fetch products')
      }
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    const newFilters = {
      ...filters,
      [name]: value
    }
    
    // Reset subcategory when category changes
    if (name === 'category') {
      newFilters.subcategory = 'all'
    }
    
    setFilters(newFilters)
    updateURLParams(newFilters)
  }

  const handleSearchChange = (e) => {
    const value = e.target.value
    setSearchInput(value)
    
    // Debounce search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      const newFilters = { ...filters, search: value }
      setFilters(newFilters)
      updateURLParams(newFilters)
    }, 500)
  }

  const updateURLParams = (newFilters) => {
    const params = new URLSearchParams()
    
    if (newFilters.category !== 'all') params.set('category', newFilters.category)
    if (newFilters.subcategory && newFilters.subcategory !== 'all') params.set('subcategory', newFilters.subcategory)
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.minPrice) params.set('minPrice', newFilters.minPrice)
    if (newFilters.maxPrice) params.set('maxPrice', newFilters.maxPrice)
    if (newFilters.minRating) params.set('minRating', newFilters.minRating)
    if (newFilters.inStock && newFilters.inStock !== 'all') params.set('inStock', newFilters.inStock)
    if (newFilters.sortBy && newFilters.sortBy !== 'newest') params.set('sortBy', newFilters.sortBy)
    
    setSearchParams(params)
  }

  const clearFilters = () => {
    const defaultFilters = {
      category: 'all',
      subcategory: 'all',
      minPrice: '',
      maxPrice: '',
      minRating: '',
      search: '',
      inStock: 'all',
      sortBy: 'newest'
    }
    setFilters(defaultFilters)
    setSearchInput('')
    setSearchParams({})
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.category !== 'all') count++
    if (filters.subcategory !== 'all') count++
    if (filters.minPrice || filters.maxPrice) count++
    if (filters.minRating) count++
    if (filters.search) count++
    if (filters.inStock !== 'all') count++
    if (filters.sortBy !== 'newest') count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  // Pagination handlers
  const handleCategoryPageChange = (category, page) => {
    setCategoryPages(prev => ({
      ...prev,
      [category]: page
    }))
    // Scroll to category section
    const element = document.getElementById(`category-${category.replace(/\s+/g, '-')}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const getPaginatedProducts = (categoryProducts, category) => {
    const currentPage = categoryPages[category] || 1
    const startIndex = (currentPage - 1) * productsPerPage
    const endIndex = startIndex + productsPerPage
    return categoryProducts.slice(startIndex, endIndex)
  }

  const getTotalPages = (categoryProducts) => {
    return Math.ceil(categoryProducts.length / productsPerPage)
  }

  return (
    <>
      {/* Header Section */}
      <section className="bg-white border-b border-gray-200 py-6 md:py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
            All Products
          </h1>
          <p className="text-base md:text-lg text-gray-600">
            {!loading && products.length > 0 ? `${products.length} ${products.length === 1 ? 'product' : 'products'} found` : 'Browse our collection'}
          </p>
        </div>
      </section>

      {/* Search Bar Section */}
      <section className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {/* Search Input */}
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products by name or description..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm md:text-base"
            />
            {searchInput && (
              <button
                onClick={() => {
                  setSearchInput('')
                  const newFilters = { ...filters, search: '' }
                  setFilters(newFilters)
                  updateURLParams(newFilters)
                }}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Active Filters Display */}
          {activeFiltersCount > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Active filters:</span>
              {filters.category !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  Category: {filters.category}
                  <button
                    onClick={() => handleFilterChange({ target: { name: 'category', value: 'all' } })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.subcategory !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {filters.subcategory}
                  <button
                    onClick={() => handleFilterChange({ target: { name: 'subcategory', value: 'all' } })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.search && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  Search: "{filters.search}"
                  <button
                    onClick={() => {
                      setSearchInput('')
                      handleFilterChange({ target: { name: 'search', value: '' } })
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  Price: {filters.minPrice ? formatCurrency(filters.minPrice) : 'Any'} - {filters.maxPrice ? formatCurrency(filters.maxPrice) : 'Any'}
                  <button
                    onClick={() => {
                      handleFilterChange({ target: { name: 'minPrice', value: '' } })
                      handleFilterChange({ target: { name: 'maxPrice', value: '' } })
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.minRating && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  Rating: {filters.minRating}+ ⭐
                  <button
                    onClick={() => handleFilterChange({ target: { name: 'minRating', value: '' } })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.inStock !== 'all' && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm">
                  {filters.inStock === 'inStock' ? 'In Stock' : 'Out of Stock'}
                  <button
                    onClick={() => handleFilterChange({ target: { name: 'inStock', value: 'all' } })}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-[#FF385C] hover:text-[#E61E4D] font-medium underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Filters Section - Above Products */}
      <section className="bg-white border-b border-gray-200 py-4">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            {activeFiltersCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-[#FF385C] hover:text-[#E61E4D] font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {/* Filters Row */}
          <div className="flex flex-wrap gap-3 md:gap-4">
            {/* Category Filter */}
            <div className="flex-shrink-0">
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm font-medium text-gray-700 bg-white"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            {filters.category !== 'all' && subcategories.length > 0 && (
              <div className="flex-shrink-0">
                <select
                  name="subcategory"
                  value={filters.subcategory}
                  onChange={handleFilterChange}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm font-medium text-gray-700 bg-white"
                >
                  <option value="all">All Subcategories</option>
                  {subcategories.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Price Range Filter */}
            <div className="flex-shrink-0 flex items-center gap-2">
              <input
                type="number"
                name="minPrice"
                placeholder="Min Price"
                value={filters.minPrice}
                onChange={handleFilterChange}
                min="0"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm"
              />
              <span className="text-gray-400">-</span>
              <input
                type="number"
                name="maxPrice"
                placeholder="Max Price"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                min="0"
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm"
              />
            </div>

            {/* Rating Filter */}
            <div className="flex-shrink-0">
              <select
                name="minRating"
                value={filters.minRating}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm font-medium text-gray-700 bg-white"
              >
                <option value="">Any Rating</option>
                <option value="4">4+ ⭐⭐⭐⭐</option>
                <option value="3">3+ ⭐⭐⭐</option>
                <option value="2">2+ ⭐⭐</option>
                <option value="1">1+ ⭐</option>
              </select>
            </div>

            {/* Stock Availability Filter */}
            <div className="flex-shrink-0">
              <select
                name="inStock"
                value={filters.inStock}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm font-medium text-gray-700 bg-white"
              >
                <option value="all">All Products</option>
                <option value="inStock">In Stock</option>
                <option value="outOfStock">Out of Stock</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex-shrink-0 ml-auto">
              <select
                name="sortBy"
                value={filters.sortBy}
                onChange={handleFilterChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-transparent text-sm font-medium text-gray-700 bg-white"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Products Section - Grouped by Category */}
      <section className="py-8 sm:py-12 bg-gray-50 min-h-screen">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex flex-col justify-center items-center py-24 bg-white rounded-xl">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FF385C] mb-4"></div>
              <p className="text-gray-500">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-gray-200">
              <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 text-lg font-semibold mb-2">{t('noProductsFound')}</p>
              <p className="text-gray-400 text-sm mb-4">{t('tryAdjustingFilters') || 'Try adjusting your filters or search terms'}</p>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="text-[#FF385C] hover:text-[#E61E4D] font-medium underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : Object.keys(productsByCategory).length === 0 ? (
            <div className="text-center py-24 bg-white rounded-xl shadow-sm border border-gray-200">
              <p className="text-gray-500 text-lg">No products to display</p>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              {/* Products Summary */}
              <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                <p className="text-base sm:text-lg font-semibold text-gray-900">
                  Showing {products.length} {products.length === 1 ? 'product' : 'products'} 
                  {Object.keys(productsByCategory).length > 1 && ` across ${Object.keys(productsByCategory).length} categories`}
                </p>
              </div>

              {/* Category Sections */}
              {Object.entries(productsByCategory).map(([category, categoryProducts]) => {
                const categoryId = category.replace(/\s+/g, '-')
                const currentPage = categoryPages[category] || 1
                const totalPages = getTotalPages(categoryProducts)
                const paginatedProducts = getPaginatedProducts(categoryProducts, category)
                const sectionId = `category-${categoryId}`
                const isVisible = visibleSections.has(sectionId)
                
                return (
                  <div 
                    key={category} 
                    id={sectionId}
                    ref={el => sectionRefs.current[sectionId] = el}
                    className={`category-section bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-700 ease-out ${
                      isVisible 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-8'
                    }`}
                  >
                    {/* Category Header */}
                    <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-200 px-6 py-4 sm:py-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                            {category}
                          </h2>
                          <p className="text-sm sm:text-base text-gray-600">
                            {categoryProducts.length} {categoryProducts.length === 1 ? (t('product') || 'product') : (t('products') || 'products')} {t('available') || 'available'}
                            {totalPages > 1 && ` • ${t('page') || 'Page'} ${currentPage} ${t('of') || 'of'} ${totalPages}`}
                          </p>
                        </div>
                        <div className="hidden sm:block w-12 h-12 rounded-full bg-[#FF385C]/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#FF385C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Products Grid for this Category - 3 columns */}
                    <div className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        {paginatedProducts.map(product => {
                          if (!product || !product._id) {
                            console.warn('Invalid product:', product)
                            return null
                          }
                          return (
                            <ProductCard key={product._id} product={product} />
                          )
                        })}
                      </div>
                    </div>

                    {/* Pagination for this Category */}
                    {totalPages > 1 && (
                      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                        <div className="flex items-center justify-between">
                          <div className={`text-sm text-gray-600 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {t('showing')} {((currentPage - 1) * productsPerPage) + 1} {t('to')} {Math.min(currentPage * productsPerPage, categoryProducts.length)} {t('of')} {categoryProducts.length} {t('products')}
                          </div>
                          <div className={`flex items-center gap-2 ${isRTL ? 'flex-row-reverse' : ''}`}>
                            <button
                              onClick={() => handleCategoryPageChange(category, currentPage - 1)}
                              disabled={currentPage === 1}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                currentPage === 1
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {t('previous')}
                            </button>
                            
                            {/* Page Numbers */}
                            <div className="flex items-center gap-1">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                // Show first page, last page, current page, and pages around current
                                if (
                                  page === 1 ||
                                  page === totalPages ||
                                  (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                  return (
                                    <button
                                      key={page}
                                      onClick={() => handleCategoryPageChange(category, page)}
                                      className={`w-10 h-10 rounded-lg font-medium text-sm transition-all ${
                                        currentPage === page
                                          ? 'bg-[#FF385C] text-white shadow-md'
                                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-gray-400'
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  )
                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                  return (
                                    <span key={page} className="text-gray-400 px-1">
                                      ...
                                    </span>
                                  )
                                }
                                return null
                              })}
                            </div>
                            
                            <button
                              onClick={() => handleCategoryPageChange(category, currentPage + 1)}
                              disabled={currentPage === totalPages}
                              className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                                currentPage === totalPages
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              {t('next')}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </>
  )
}

export default Products
