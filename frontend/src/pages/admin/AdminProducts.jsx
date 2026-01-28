import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { formatCurrency } from '../../utils/currency'

const AdminProducts = () => {
  const [products, setProducts] = useState([])
  const [productsWithFavorites, setProductsWithFavorites] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [editingProduct, setEditingProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    discountPercentage: '',
    category: '',
    subcategory: '',
    stock: '',
    images: [],
    features: []
  })
  const [uploadingImages, setUploadingImages] = useState(false)
  const [categories, setCategories] = useState([])
  const [subcategories, setSubcategories] = useState([])
  const [availableSubcategories, setAvailableSubcategories] = useState([])

  useEffect(() => {
    fetchProducts()
    fetchFavoritesData()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (formData.category) {
      fetchSubcategories(formData.category)
    } else {
      setAvailableSubcategories([])
    }
  }, [formData.category])

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data)
    } catch (error) {
      toast.error('Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const fetchFavoritesData = async () => {
    try {
      const res = await api.get('/admin/favorites')
      setProductsWithFavorites(res.data)
    } catch (error) {
      console.error('Failed to fetch favorites data:', error)
    }
  }

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories')
      setCategories(res.data || [])
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchSubcategories = async (category) => {
    try {
      const res = await api.get(`/products/subcategories?category=${encodeURIComponent(category)}`)
      setAvailableSubcategories(res.data || [])
    } catch (error) {
      console.error('Failed to fetch subcategories:', error)
      setAvailableSubcategories([])
    }
  }

  const getFavoriteCount = (productId) => {
    const productData = productsWithFavorites.find(
      item => item.product._id === productId || item.product === productId
    )
    return productData ? productData.favoriteCount : 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const productData = {
        ...formData,
        price: Number(formData.price),
        discountPercentage: formData.discountPercentage ? Number(formData.discountPercentage) : 0,
        stock: Number(formData.stock),
        images: formData.images.filter(img => img && img.trim()), // Remove empty images
        features: formData.features.filter(feature => feature && feature.trim()) // Remove empty features
      }

      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, productData)
        toast.success('Product updated successfully!')
      } else {
        await api.post('/products', productData)
        toast.success('Product created successfully!')
      }

      setShowModal(false)
      setEditingProduct(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        discountPercentage: '',
        category: '',
        subcategory: '',
        stock: '',
        images: [],
        features: []
      })
      fetchProducts()
      fetchFavoritesData()
    } catch (error) {
      console.error('Save product error:', error)
      toast.error(error.response?.data?.message || 'Failed to save product')
    }
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    const images = product.images || []
    const features = product.features || []
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price,
      discountPercentage: product.discountPercentage || '',
      category: product.category || '',
      subcategory: product.subcategory || '',
      stock: product.stock,
      images: images,
      features: features
    })
    setShowModal(true)
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingImages(true)
    try {
      const uploadPromises = files.map(async (file) => {
        // Validate file type (images and videos)
        const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
        const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
        const isImage = file.type.startsWith('image/') || allowedImageTypes.includes(file.type)
        const isVideo = file.type.startsWith('video/') || allowedVideoTypes.includes(file.type)
        
        if (!isImage && !isVideo) {
          throw new Error(`${file.name} is not a valid image or video file`)
        }

        // Validate file size (100MB max for videos, 10MB for images)
        const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024
        if (file.size > maxSize) {
          const maxSizeMB = Math.round(maxSize / (1024 * 1024))
          throw new Error(`${file.name} is too large (max ${maxSizeMB}MB)`)
        }

        const formData = new FormData()
        formData.append('image', file)

        const res = await api.post('/admin/upload', formData)
        return res.data.imageUrl || res.data.fileUrl
      })

      const uploadedUrls = await Promise.all(uploadPromises)
      const newImages = [...formData.images, ...uploadedUrls]
      setFormData({ ...formData, images: newImages })
      toast.success(`${uploadedUrls.length} file(s) uploaded successfully!`)
    } catch (error) {
      console.error('Upload error:', error)
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to upload files'
      toast.error(errorMessage)
    } finally {
      setUploadingImages(false)
      // Reset file input
      e.target.value = ''
    }
  }

  const handleRemoveImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index)
    setFormData({ ...formData, images: newImages })
  }

  const handleMoveImageUp = (index) => {
    if (index === 0) return // Already at the top
    const newImages = [...formData.images]
    const temp = newImages[index]
    newImages[index] = newImages[index - 1]
    newImages[index - 1] = temp
    setFormData({ ...formData, images: newImages })
  }

  const handleMoveImageDown = (index) => {
    if (index === formData.images.length - 1) return // Already at the bottom
    const newImages = [...formData.images]
    const temp = newImages[index]
    newImages[index] = newImages[index + 1]
    newImages[index + 1] = temp
    setFormData({ ...formData, images: newImages })
  }

  const handleImageUrlAdd = (url) => {
    if (url.trim()) {
      const newImages = [...formData.images, url.trim()]
      setFormData({ ...formData, images: newImages })
    }
  }

  const handleAddFeature = (feature) => {
    if (feature.trim()) {
      const newFeatures = [...formData.features, feature.trim()]
      setFormData({ ...formData, features: newFeatures })
    }
  }

  const handleRemoveFeature = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: newFeatures })
  }

  const handleMoveFeatureUp = (index) => {
    if (index === 0) return
    const newFeatures = [...formData.features]
    const temp = newFeatures[index]
    newFeatures[index] = newFeatures[index - 1]
    newFeatures[index - 1] = temp
    setFormData({ ...formData, features: newFeatures })
  }

  const handleMoveFeatureDown = (index) => {
    if (index === formData.features.length - 1) return
    const newFeatures = [...formData.features]
    const temp = newFeatures[index]
    newFeatures[index] = newFeatures[index + 1]
    newFeatures[index + 1] = temp
    setFormData({ ...formData, features: newFeatures })
  }

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return
    }

    try {
      await api.delete(`/products/${productId}`)
      toast.success('Product deleted successfully')
      fetchProducts()
    } catch (error) {
      toast.error('Failed to delete product')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    if (name === 'category') {
      // Reset subcategory when category changes
      setFormData({ ...formData, category: value, subcategory: '' })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  // Filter products based on search and filters
  const filteredProducts = products.filter(product => {
    const matchesSearch = !searchQuery || 
      product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter

    const matchesStock = stockFilter === 'all' ||
      (stockFilter === 'in-stock' && product.stock > 0) ||
      (stockFilter === 'out-of-stock' && product.stock === 0) ||
      (stockFilter === 'low-stock' && product.stock > 0 && product.stock <= 10)

    return matchesSearch && matchesCategory && matchesStock
  })

  // Get unique categories for filter dropdown
  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))]

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-200 border-t-[#FF385C] mb-4"></div>
          <p className="text-gray-600 font-medium">Loading products...</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Product Management</h1>
            <p className="text-gray-600 mt-1">Manage your product catalog</p>
          </div>
          <button
            onClick={() => {
              setEditingProduct(null)
              setFormData({
                name: '',
                description: '',
                price: '',
                discountPercentage: '',
                category: '',
                subcategory: '',
                stock: '',
                images: [],
                features: []
              })
              setShowModal(true)
            }}
            className="bg-[#FF385C] hover:bg-[#E61E4D] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Add New Product</span>
            </div>
          </button>
        </div>

        {/* Search and Filters Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search Products</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by Name, Category, Description..."
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    <svg className="h-5 w-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Stock Status</label>
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="block w-full px-3 py-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="all">All Stock</option>
                <option value="in-stock">In Stock</option>
                <option value="low-stock">Low Stock (≤10)</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
          
          {/* Results Count */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing <span className="font-semibold text-gray-900">{filteredProducts.length}</span> of <span className="font-semibold text-gray-900">{products.length}</span> products
            </span>
            {(searchQuery || categoryFilter !== 'all' || stockFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setCategoryFilter('all')
                  setStockFilter('all')
                }}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">All Products</h2>
            <p className="text-sm text-gray-600 mt-1">{filteredProducts.length} products</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Image
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="hidden md:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Subcategory
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="hidden sm:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="hidden lg:table-cell px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Favorites
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-sm">
                          {products.length === 0 ? 'No products found' : 'No products match your filters'}
                        </p>
                        {products.length > 0 && (
                          <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filter criteria</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(product => (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.images && product.images.length > 0 ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-14 w-14 object-cover rounded-lg border border-gray-200 shadow-sm"
                          />
                        ) : (
                          <div className="h-14 w-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-lg flex items-center justify-center border border-gray-200">
                            <span className="text-gray-400 text-xs font-medium">No Image</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900 max-w-[200px] truncate">
                          {product.name}
                        </div>
                        <div className="md:hidden text-xs text-gray-500 mt-1">
                          {product.category} • {formatCurrency(product.price)}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                          {product.category}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{product.subcategory || '-'}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-bold text-gray-900">
                          {formatCurrency(product.price)}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          product.stock > 10 ? 'bg-green-100 text-green-800' :
                          product.stock > 0 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-sm text-gray-600">
                            {product.averageRating?.toFixed(1) || '0.0'} ({product.numReviews || 0})
                          </span>
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <svg className="w-4 h-4 text-[#FF385C] mr-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          <span className="text-sm font-semibold text-gray-900">{getFavoriteCount(product._id)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="text-[#FF385C] hover:text-[#E61E4D] px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-semibold"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(product._id)}
                            className="text-red-600 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-semibold"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add/Edit Product Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[95vh] md:max-h-[90vh] overflow-y-auto border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingProduct(null)
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4 md:space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                    placeholder="Enter product name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows="4"
                    className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all resize-none"
                    placeholder="Enter product description"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price (MAD)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        required
                        min="0"
                        step="0.01"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                        placeholder="0.00"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">MAD</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Discount Percentage (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discountPercentage"
                        value={formData.discountPercentage}
                        onChange={handleChange}
                        min="0"
                        max="100"
                        step="1"
                        className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">%</span>
                    </div>
                    {formData.discountPercentage && formData.price && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        Discounted Price: {formatCurrency(formData.price * (1 - formData.discountPercentage / 100))}
                      </p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      type="number"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      required
                      min="0"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                      placeholder="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category *
                    </label>
                    <input
                      type="text"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      required
                      list="categories-list"
                      placeholder="e.g., Clothes, Electronics, Books"
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                    />
                    <datalist id="categories-list">
                      {categories.map((cat) => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                    <p className="text-xs text-gray-500 mt-1">
                      Type to search existing categories or enter a new one
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Subcategory
                    </label>
                    <input
                      type="text"
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      disabled={!formData.category}
                      list="subcategories-list"
                      placeholder={formData.category ? "e.g., Men, Women, Children" : "Select category first"}
                      className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <datalist id="subcategories-list">
                      {availableSubcategories.map((subcat) => (
                        <option key={subcat} value={subcat} />
                      ))}
                    </datalist>
                    <p className="text-xs text-gray-500 mt-1">
                      {formData.category ? 'Type to search existing subcategories or enter a new one' : 'Select a category first'}
                    </p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Images
                  </label>
                
                  {/* Upload from Local */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Images or Videos from Computer
                    </label>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploadingImages}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-lg file:border-0
                        file:text-sm file:font-semibold
                        file:bg-[#FF385C] file:text-white
                        hover:file:bg-[#E61E4D] file:cursor-pointer
                        disabled:opacity-50"
                    />
                    {uploadingImages && (
                      <p className="text-sm text-[#FF385C] mt-2 font-medium">Uploading files...</p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      You can select multiple files. Max 10MB per image, 100MB per video.
                    </p>
                  </div>

                  {/* Add Image URL */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Or Add Image URL
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://example.com/image.jpg"
                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleImageUrlAdd(e.target.value)
                            e.target.value = ''
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.target.previousElementSibling
                          handleImageUrlAdd(input.value)
                          input.value = ''
                        }}
                        className="px-4 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg font-semibold transition-colors"
                      >
                        Add URL
                      </button>
                    </div>
                  </div>

                {/* Image Previews */}
                {formData.images.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Image Previews ({formData.images.length})
                      <span className="text-xs text-gray-500 ml-2">First image will be shown as primary</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4">
                      {formData.images.map((image, index) => (
                        <div key={index} className={`relative group ${index === 0 ? 'ring-2 ring-[#FF385C] ring-offset-2' : ''}`}>
                          <img
                            src={image}
                            alt={`Preview ${index + 1}`}
                            className={`w-full h-24 md:h-32 object-cover rounded-lg border-2 ${index === 0 ? 'border-[#FF385C]' : 'border-gray-300'}`}
                            onError={(e) => {
                              e.target.src = 'https://via.placeholder.com/200?text=Invalid+Image'
                            }}
                          />
                          {/* Primary Badge */}
                          {index === 0 && (
                            <div className="absolute top-1 left-1 md:top-2 md:left-2 bg-[#FF385C] text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg">
                              Primary
                            </div>
                          )}
                          {/* Position Number */}
                          <div className="absolute bottom-1 left-1 md:bottom-2 md:left-2 bg-black bg-opacity-60 text-white text-xs font-semibold px-2 py-1 rounded-md">
                            #{index + 1}
                          </div>
                          {/* Control Buttons */}
                          <div className="absolute top-1 right-1 md:top-2 md:right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {/* Remove Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(index)}
                              className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg"
                              title="Remove image"
                            >
                              <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                            {/* Move Up Button */}
                            {index > 0 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImageUp(index)}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow-lg"
                                title="Move up (make primary)"
                              >
                                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                              </button>
                            )}
                            {/* Move Down Button */}
                            {index < formData.images.length - 1 && (
                              <button
                                type="button"
                                onClick={() => handleMoveImageDown(index)}
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow-lg"
                                title="Move down"
                              >
                                <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Product Features */}
                <div className="mt-8">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Features
                  </label>
                  
                  {/* Add Feature Input */}
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Add Feature
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g., Premium quality materials"
                        className="flex-1 px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddFeature(e.target.value)
                            e.target.value = ''
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = e.target.previousElementSibling
                          handleAddFeature(input.value)
                          input.value = ''
                        }}
                        className="px-4 py-2.5 bg-[#FF385C] hover:bg-[#E61E4D] text-white rounded-lg font-semibold transition-colors"
                      >
                        Add Feature
                      </button>
                    </div>
                  </div>

                  {/* Features List */}
                  {formData.features.length > 0 && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Features ({formData.features.length})
                      </label>
                      <div className="space-y-3">
                        {formData.features.map((feature, index) => (
                          <div key={index} className="relative group p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                            <div className="flex items-start gap-3">
                              <div className="flex-shrink-0 w-8 h-8 bg-[#FF385C] rounded-full flex items-center justify-center text-white font-bold text-sm mt-0.5">
                                {index + 1}
                              </div>
                              <p className="flex-1 text-gray-700 leading-relaxed pt-1">{feature}</p>
                              <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {/* Remove Button */}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveFeature(index)}
                                  className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg"
                                  title="Remove feature"
                                >
                                  <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                                {/* Move Up Button */}
                                {index > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveFeatureUp(index)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow-lg"
                                    title="Move up"
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                    </svg>
                                  </button>
                                )}
                                {/* Move Down Button */}
                                {index < formData.features.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveFeatureDown(index)}
                                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-1 shadow-lg"
                                    title="Move down"
                                  >
                                    <svg className="w-3 h-3 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    className="flex-1 bg-[#FF385C] hover:bg-[#E61E4D] text-white px-6 py-3 rounded-lg font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    {editingProduct ? 'Update Product' : 'Create Product'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingProduct(null)
                    }}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default AdminProducts

