import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import api from '../utils/api'
import ProductCard from '../components/ProductCard'
import { formatDirham, getUnitPrice, productPath } from '../utils/product'
import ProductCardSkeleton from '../components/ProductCardSkeleton'
import Footer from '../components/Footer'
import Chatbot from '../components/Chatbot'
import toast from 'react-hot-toast'

const Home = () => {
  const { t } = useLanguage()
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

  const fetchAllProducts = async (silent = false) => {
    if (!silent) setLoading(true)
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
      if (!silent) toast.error('تعذر تحميل المنتجات')
      console.error('Error fetching products:', error)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    const refreshVisible = () => {
      if (document.visibilityState !== 'visible') return
      fetchAllProducts(true)
      fetchGalleryProducts()
    }
    document.addEventListener('visibilitychange', refreshVisible)
    return () => document.removeEventListener('visibilitychange', refreshVisible)
  }, [])

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
      <section className="relative overflow-hidden bg-[#F6F4F1]">
        {heroBackgroundImage && (
          <img src={heroBackgroundImage} alt="" className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25" />
        )}
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-14 lg:px-8 lg:py-20">
          <div className="order-2 lg:order-1">
            <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-[0.16em] text-[#D97736] shadow-sm">
              FINDSTORE
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold leading-[1.15] text-[#171717] sm:text-6xl">
              {t('findPerfectProduct')}
            </h1>
            <p className="mt-5 max-w-md text-base leading-8 text-[#5c5c5c] sm:text-lg">
              {t('discoverUnique')}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/products" className="inline-flex h-12 items-center justify-center rounded-full bg-[#171717] px-7 font-semibold text-white transition hover:bg-black">
                {t('shopNow')}
              </Link>
              {galleryProducts[0] ? (
                <Link to={productPath(galleryProducts[0])} className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-7 font-semibold text-[#171717]">
                  اكتشف المنتج
                </Link>
              ) : (
                <Link to="/products" className="inline-flex h-12 items-center justify-center rounded-full border border-black/10 bg-white px-7 font-semibold text-[#171717]">
                  {t('exploreCollection')}
                </Link>
              )}
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {['توصيل لجميع مدن المغرب', 'الدفع عند الاستلام', 'منتجات مختارة بعناية'].map((item) => (
                <p key={item} className="rounded-2xl bg-white/80 px-3 py-3 text-sm font-medium leading-6 text-[#242424] shadow-sm">
                  {item}
                </p>
              ))}
            </div>
          </div>

          <div className={`order-1 grid gap-4 lg:order-2 ${galleryProducts.length > 1 ? 'sm:grid-cols-[1.45fr_0.75fr]' : ''}`}>
            {loading && galleryProducts.length === 0 ? (
              <div className="aspect-[4/5] animate-pulse rounded-[32px] bg-white" />
            ) : galleryProducts[0]?.images?.[0] ? (
              <Link to={productPath(galleryProducts[0])} className="group relative block overflow-hidden rounded-[32px] bg-white shadow-[0_24px_60px_rgba(23,23,23,0.1)]">
                <img
                  src={galleryProducts[0].images[0]}
                  alt={galleryProducts[0].name}
                  className="aspect-[4/5] w-full object-cover transition duration-700 group-hover:scale-[1.03] sm:aspect-[3/4]"
                />
                <div className="absolute inset-x-3 bottom-3 rounded-2xl bg-white/95 p-4 shadow-lg backdrop-blur sm:inset-x-4 sm:bottom-4">
                  <p className="text-xs font-medium text-[#D97736]">{galleryProducts[0].category}</p>
                  <div className="mt-1 flex items-end justify-between gap-3">
                    <p className="line-clamp-2 text-sm font-semibold leading-6 sm:text-base">{galleryProducts[0].name}</p>
                    <p className="shrink-0 text-sm font-semibold">{formatDirham(getUnitPrice(galleryProducts[0]))}</p>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-[32px] bg-white text-sm text-[#777777]">FINDSTORE</div>
            )}

            {galleryProducts.length > 1 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-1">
                {galleryProducts.slice(1, 3).map((product) => (
                  <Link key={product._id} to={productPath(product)} className="group overflow-hidden rounded-3xl bg-white shadow-sm">
                    <img src={product.images[0]} alt={product.name} className="aspect-square w-full object-cover transition duration-500 group-hover:scale-105" />
                    <div className="p-3">
                      <p className="line-clamp-1 text-sm font-semibold">{product.name}</p>
                      <p className="mt-1 text-xs text-[#777777]">{formatDirham(getUnitPrice(product))}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Product Gallery Section - Scrolling Images */}
      {(loading || galleryProducts.length > 0) && (
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
            {loading ? (
              <div className="flex gap-3 sm:gap-4 md:gap-6 overflow-hidden px-2">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="flex-shrink-0 w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-lg sm:rounded-xl md:rounded-2xl bg-gray-200 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              <div className="flex animate-scroll gap-3 sm:gap-4 md:gap-6">
              {/* First set of images */}
              {galleryProducts.map((product, index) => (
                <Link
                  key={`gallery-1-${product._id}`}
                  to={productPath(product)}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
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
                  to={productPath(product)}
                  className="flex-shrink-0 group"
                >
                  <div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-lg sm:rounded-xl md:rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      loading="lazy"
                      decoding="async"
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
            )}
          </div>
        </section>
      )}

      {/* Products by Category Section */}
      <section id="products" className="py-8 sm:py-12 md:py-16 bg-white">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            /* Skeleton loader - 2 category blocks with product cards */
            <div className="space-y-12 sm:space-y-16 md:space-y-20">
              {[1, 2].map((block) => (
                <div key={block} className="animate-pulse">
                  <div className="flex items-center justify-between mb-6 sm:mb-8">
                    <div className="space-y-2">
                      <div className="h-8 sm:h-9 bg-gray-200 rounded-lg w-48 sm:w-56" />
                      <div className="h-4 bg-gray-100 rounded-lg w-36" />
                    </div>
                    <div className="hidden sm:block h-5 bg-gray-200 rounded-lg w-20" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
                    {[...Array(8)].map((_, i) => (
                      <ProductCardSkeleton key={i} />
                    ))}
                  </div>
                </div>
              ))}
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

      {/* Chatbot Component */}
      <Chatbot />

      {/* Floating WhatsApp Button - Fixed at bottom left */}
      <button
        onClick={handleWhatsApp}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 sm:w-16 sm:h-16 bg-[#25D366] hover:bg-[#20BA5A] text-white rounded-full shadow-2xl hover:shadow-[#25D366]/50 transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95"
        aria-label={t('whatsappContact')}
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
