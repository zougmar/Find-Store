import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import api from '../utils/api'
import ProductCard from '../components/ProductCard'
import Footer from '../components/Footer'
import toast from 'react-hot-toast'

const Home = () => {
  const { t, isRTL } = useLanguage()
  const [productsByCategory, setProductsByCategory] = useState({})
  const [galleryProducts, setGalleryProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [heroBackgroundImage, setHeroBackgroundImage] = useState(null)
  const [visibleSections, setVisibleSections] = useState(new Set())
  const sectionRefs = useRef({})

  useEffect(() => {
    fetchCategories()
    fetchGalleryProducts()
    fetchHomepageSettings()
    fetchAllProducts()
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

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories')
      setCategories(res.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchGalleryProducts = async () => {
    try {
      const res = await api.get('/products?sortBy=newest')
      // Get products with images only
      const productsWithImages = Array.isArray(res.data) 
        ? res.data.filter(p => p.images && p.images.length > 0)
        : []
      setGalleryProducts(productsWithImages)
    } catch (error) {
      console.error('Error fetching gallery products:', error)
    }
  }

  const fetchHomepageSettings = async () => {
    try {
      const res = await api.get('/pages/home')
      console.log('Homepage settings fetched:', res.data)
      if (res.data && res.data.sections) {
        // Find the hero section
        const heroSection = res.data.sections.find(s => s.type === 'hero' && s.visible !== false)
        console.log('Hero section found:', heroSection)
        if (heroSection && heroSection.backgroundImage) {
          // Process the image URL to ensure it's accessible
          let imageUrl = heroSection.backgroundImage
          
          // If it's a relative path starting with /uploads, it should work with the proxy
          // If it's already a full URL, use it as is
          if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
            // Ensure it starts with /uploads if it's a local file
            if (!imageUrl.startsWith('/')) {
              imageUrl = `/uploads/${imageUrl}`
            }
          }
          
          console.log('Setting background image:', imageUrl)
          setHeroBackgroundImage(imageUrl)
        } else {
          console.log('No background image in hero section')
        }
      }
    } catch (error) {
      // If page doesn't exist or error, use default
      console.error('Error fetching homepage settings:', error)
      console.error('Error details:', error.response?.data || error.message)
    }
  }

  const fetchAllProducts = async () => {
    setLoading(true)
    try {
      const res = await api.get('/products?sortBy=newest')
      const allProducts = Array.isArray(res.data) ? res.data : []
      
      // Group products by category
      const grouped = {}
      allProducts.forEach(product => {
        const category = product.category || 'Uncategorized'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(product)
      })
      
      setProductsByCategory(grouped)
    } catch (error) {
      toast.error('Failed to fetch products')
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWhatsApp = () => {
    // WhatsApp phone number - same as in ProductDetail
    const whatsappPhone = '212707625535'
    
    // General contact message in Arabic
    const message = `مرحبا! 👋

أنا مهتم بمنتجاتكم وأود معرفة المزيد.

هل يمكنك مساعدتي؟`

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message)
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${encodedMessage}`
    
    // Open WhatsApp in a new tab/window
    window.open(whatsappUrl, '_blank')
    
    toast.success('جاري فتح واتساب...', {
      icon: '💬',
      duration: 2000
    })
  }

  return (
    <>
      {/* Hero Section - Professional Design */}
      <section className="relative min-h-[70vh] sm:min-h-[80vh] md:min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image with Parallax Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105 transition-transform duration-700 hover:scale-100"
          style={{
            backgroundImage: heroBackgroundImage 
              ? `url(${heroBackgroundImage})` 
              : `url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
            backgroundColor: !heroBackgroundImage ? '#f8f9fa' : 'transparent'
          }}
        >
          {/* Professional Overlay with Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40"></div>
        </div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#FF385C]/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 w-full">
          <div className="text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 sm:mb-8 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
              <span className="w-2 h-2 bg-[#FF385C] rounded-full animate-pulse"></span>
              <span className="text-white/90 text-xs sm:text-sm font-medium">{t('newArrivals')}</span>
            </div>
            
            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white mb-4 sm:mb-6 md:mb-8 leading-[1.1] tracking-tight">
              {t('findPerfectProduct')}
              <br />
              <span className="bg-gradient-to-r from-[#FF385C] via-pink-500 to-[#FF385C] bg-clip-text text-transparent animate-gradient">
                {t('product')}
              </span>
            </h1>
            
            {/* Subheading */}
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-8 sm:mb-10 md:mb-12 max-w-2xl mx-auto leading-relaxed font-light">
              {t('discoverUnique')}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
              <Link
                to="/products"
                className="group relative inline-flex items-center justify-center gap-3 bg-[#FF385C] hover:bg-[#E61E4D] text-white px-8 py-4 sm:px-10 sm:py-5 rounded-xl font-bold text-base sm:text-lg transition-all duration-300 shadow-2xl hover:shadow-[#FF385C]/50 hover:scale-105 active:scale-95 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {t('shopNow')}
                  <svg className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF385C] to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
              
              <Link
                to="/products"
                className="group inline-flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white border-2 border-white/30 hover:border-white/50 px-8 py-4 sm:px-10 sm:py-5 rounded-xl font-semibold text-base sm:text-lg transition-all duration-300"
              >
                {t('exploreCollection')}
                <svg className={`w-5 h-5 transition-transform ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            
            {/* Trust Indicators */}
            <div className="mt-12 sm:mt-16 flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF385C]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('qualityGuaranteed')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF385C]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                  <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                </svg>
                <span>{t('freeShipping')}</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#FF385C]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{t('securePayment')}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Professional Scroll Indicator */}
        <div className="absolute bottom-6 sm:bottom-8 left-1/2 transform -translate-x-1/2 z-10">
          <a 
            href="#products" 
            className="flex flex-col items-center gap-2 text-white/70 hover:text-white transition-all duration-300 group"
          >
            <span className="text-xs font-medium uppercase tracking-wider">{t('scroll')}</span>
            <div className="w-6 h-10 border-2 border-white/50 rounded-full flex items-start justify-center p-2 group-hover:border-white transition-colors">
              <div className="w-1.5 h-1.5 bg-white/70 rounded-full animate-bounce"></div>
            </div>
          </a>
        </div>
      </section>

      {/* Product Gallery Section - Scrolling Images */}
      {galleryProducts.length > 0 && (
        <section 
          id="gallery-section"
          ref={el => sectionRefs.current['gallery-section'] = el}
          className={`py-6 sm:py-8 md:py-12 bg-gray-50 overflow-hidden transition-all duration-700 ease-out ${
            visibleSections.has('gallery-section')
              ? 'opacity-100 translate-y-0' 
              : 'opacity-0 translate-y-8'
          }`}
        >
          <div className="relative">
            {/* Scrolling Gallery */}
            <div className="flex animate-scroll gap-3 sm:gap-4 md:gap-6">
              {/* First set of images */}
              {galleryProducts.map((product, index) => (
                <Link
                  key={`gallery-1-${product._id}`}
                  to={`/product/${product._id}`}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4">
                        <h3 className="text-white font-semibold text-xs sm:text-sm md:text-base line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-white/90 text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
                          {product.category}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
              {/* Duplicate set for seamless loop */}
              {galleryProducts.map((product, index) => (
                <Link
                  key={`gallery-2-${product._id}`}
                  to={`/product/${product._id}`}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4">
                        <h3 className="text-white font-semibold text-xs sm:text-sm md:text-base line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-white/90 text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
                          {product.category}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Products by Category Section */}
      <section id="products" className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="flex justify-center items-center py-12 sm:py-16 md:py-24">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-[#FF385C]"></div>
            </div>
          ) : Object.keys(productsByCategory).length === 0 ? (
            <div className="text-center py-12 sm:py-16 md:py-24">
              <p className="text-gray-500 text-base sm:text-lg">{t('noProductsFound')}</p>
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16 md:space-y-20">
              {Object.entries(productsByCategory).map(([category, products], index) => {
                const categoryId = `home-category-${category.replace(/\s+/g, '-')}`
                const isVisible = visibleSections.has(categoryId)
                
                return (
                  <div 
                    key={category} 
                    id={categoryId}
                    ref={el => sectionRefs.current[categoryId] = el}
                    className={`category-section transition-all duration-700 ease-out ${
                      isVisible 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-8'
                    }`}
                    style={{ transitionDelay: `${index * 100}ms` }}
                  >
                  {/* Category Header */}
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <div>
                      <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                        {category}
                      </h2>
                      <p className="text-sm sm:text-base text-gray-600">
                        {products.length} {products.length === 1 ? t('product') : t('products')} {t('available')}
                      </p>
                    </div>
                    <Link
                      to={`/products?category=${encodeURIComponent(category)}`}
                      className="hidden sm:flex items-center gap-2 text-[#FF385C] hover:text-[#E61E4D] font-semibold text-sm sm:text-base transition-colors"
                    >
                      {t('viewAll')}
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>

                  {/* Products Grid for this Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                    {products.slice(0, 8).map(product => (
                      <ProductCard key={product._id} product={product} />
                    ))}
                  </div>

                  {/* View All Link for Mobile */}
                  {products.length > 8 && (
                    <div className="mt-6 sm:hidden text-center">
                      <Link
                        to={`/products?category=${encodeURIComponent(category)}`}
                        className="inline-flex items-center gap-2 text-[#FF385C] hover:text-[#E61E4D] font-semibold text-sm transition-colors"
                      >
                        {t('viewAllProducts')} ({products.length})
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
                    </div>
                  )}

                  {/* View All Link for Desktop (if more than 8 products) */}
                  {products.length > 8 && (
                    <div className="mt-8 hidden sm:flex justify-center">
                      <Link
                        to={`/products?category=${encodeURIComponent(category)}`}
                        className="inline-flex items-center gap-2 bg-white border-2 border-[#FF385C] text-[#FF385C] hover:bg-[#FF385C] hover:text-white px-6 py-3 rounded-full font-semibold text-sm transition-all shadow-md hover:shadow-lg"
                      >
                        {t('viewAllProducts')} ({products.length})
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </Link>
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

      {/* Floating WhatsApp Button - Fixed at bottom left */}
      <button
        onClick={handleWhatsApp}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-2xl hover:shadow-[#25D366]/50 transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95"
        aria-label="Contact us on WhatsApp"
      >
        {/* WhatsApp Icon */}
        <svg 
          className="w-7 h-7 sm:w-8 sm:h-8 transition-transform group-hover:scale-110" 
          fill="currentColor" 
          viewBox="0 0 24 24" 
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
        
        {/* Pulse animation ring */}
        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20"></span>
      </button>
    </>
  )
}

export default Home
