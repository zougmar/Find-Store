import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import api from '../utils/api'
import logoImage from '../images/logo.png'

// Helper function to get image URL
const getImageUrl = (imagePath) => {
  if (!imagePath || imagePath.trim() === '') return null
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) return imagePath
  if (imagePath.startsWith('/uploads/')) return imagePath
  return imagePath.startsWith('/') ? imagePath : `/uploads/${imagePath}`
}

const Navbar = () => {
  const { user, logout, isAdmin, fetchUser } = useAuth()
  const { getCartItemsCount } = useCart()
  const { t, isRTL } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [categorySubcategories, setCategorySubcategories] = useState({}) // { category: [subcategories] }
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(t('category'))
  const [imageKey, setImageKey] = useState(0)

  useEffect(() => {
    fetchCategories()
    fetchAllSubcategories()
    const interval = setInterval(() => {
      fetchCategories()
      fetchAllSubcategories()
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Listen for user updates and refresh user data
  useEffect(() => {
    const handleUserUpdate = async () => {
      setImageKey(prev => prev + 1)
      if (fetchUser) await fetchUser()
    }
    window.addEventListener('userUpdated', handleUserUpdate)
    return () => window.removeEventListener('userUpdated', handleUserUpdate)
  }, [fetchUser])

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false)
  }, [location.pathname])

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (showMobileMenu) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [showMobileMenu])

  // Update selected category based on URL
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const categoryFromUrl = params.get('category')
    const subcategoryFromUrl = params.get('subcategory')
    if (subcategoryFromUrl) {
      setSelectedCategory(decodeURIComponent(subcategoryFromUrl))
    } else if (categoryFromUrl) {
      setSelectedCategory(decodeURIComponent(categoryFromUrl))
    } else {
      setSelectedCategory(t('category'))
    }
  }, [location.search, t])

  const fetchCategories = async () => {
    try {
      const res = await api.get('/products/categories')
      setCategories(res.data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchAllSubcategories = async () => {
    try {
      // Fetch subcategories for each category
      const categoriesList = await api.get('/products/categories')
      const categoriesData = categoriesList.data || []
      
      const subcategoriesMap = {}
      
      // Fetch subcategories for each category
      await Promise.all(
        categoriesData.map(async (category) => {
          try {
            const res = await api.get(`/products/subcategories?category=${encodeURIComponent(category)}`)
            if (res.data && res.data.length > 0) {
              subcategoriesMap[category] = res.data
            }
          } catch (error) {
            console.error(`Error fetching subcategories for ${category}:`, error)
          }
        })
      )
      
      setCategorySubcategories(subcategoriesMap)
    } catch (error) {
      console.error('Error fetching subcategories:', error)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleCategoryClick = (category) => {
    if (category === 'all') {
      navigate('/products')
      setSelectedCategory('Category')
    } else {
      navigate(`/products?category=${encodeURIComponent(category)}`)
      setSelectedCategory(category)
    }
    setShowCategoriesMenu(false)
  }

  const handleSubcategoryClick = (category, subcategory) => {
    navigate(`/products?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}`)
    setSelectedCategory(subcategory)
    setShowCategoriesMenu(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
    } else {
      navigate('/products')
    }
  }

  const handleCategoryToggle = (e) => {
    e.stopPropagation()
    setShowCategoriesMenu(!showCategoriesMenu)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showCategoriesMenu && !event.target.closest('.category-dropdown-container')) {
        setShowCategoriesMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCategoriesMenu])

  const navLinkClass = (path) => {
    const active = path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
    return `shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm transition ${active ? 'bg-[#171717] font-semibold text-white' : 'font-medium text-[#242424] hover:bg-[#F7F7F5]'}`
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-black/5 bg-white/90 text-[#242424] backdrop-blur-md" dir="rtl">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:h-[72px] sm:px-6 lg:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <img src={logoImage} alt="FINDSTORE" className="h-10 w-10 rounded-full object-cover" />
          <span className="hidden text-sm font-semibold tracking-[0.16em] sm:block">FINDSTORE</span>
        </Link>

        <div className="hidden items-center gap-1 lg:flex">
          <Link to="/" className={navLinkClass('/')}>{t('homepage')}</Link>
          <Link to="/products" className={navLinkClass('/products')}>{t('products')}</Link>
          <div className="category-dropdown-container relative">
            <button type="button" onClick={handleCategoryToggle} className="shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium hover:bg-[#F7F7F5]">
              {selectedCategory === t('category') ? t('categories') : selectedCategory}
            </button>
            {showCategoriesMenu && (
              <div className="absolute start-0 top-full z-50 mt-2 max-h-96 w-64 overflow-y-auto rounded-2xl border border-black/5 bg-white py-2 shadow-xl">
                <button type="button" onClick={() => handleCategoryClick('all')} className="block w-full px-4 py-2.5 text-start text-sm font-semibold hover:bg-[#F7F7F5]">
                  {t('allCategories')}
                </button>
                {categories.map((category) => {
                  const subcategories = categorySubcategories[category] || []
                  return (
                    <div key={category} className="border-t border-black/5">
                      <button type="button" onClick={() => handleCategoryClick(category)} className="block w-full px-4 py-2.5 text-start text-sm font-semibold hover:bg-[#F7F7F5]">
                        {category}
                      </button>
                      {subcategories.map((subcategory) => (
                        <button
                          key={`${category}-${subcategory}`}
                          type="button"
                          onClick={() => handleSubcategoryClick(category, subcategory)}
                          className="block w-full px-7 py-2 text-start text-sm text-[#777777] hover:bg-[#F7F7F5] hover:text-[#242424]"
                        >
                          {subcategory}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <Link to="/about" className={navLinkClass('/about')}>{t('about')}</Link>
          <Link to="/contact" className={navLinkClass('/contact')}>{t('contact')}</Link>
        </div>

        <div className="ms-auto flex items-center gap-2">
          <form onSubmit={handleSearch} className="hidden h-10 items-center rounded-full bg-[#F7F7F5] px-3 md:flex md:w-44 lg:w-56">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchProducts')}
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#777777]"
            />
            <button type="submit" className="text-[#777777]" aria-label={t('search')}>
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
              </svg>
            </button>
          </form>

          <Link to="/cart" className="relative grid h-10 w-10 place-items-center rounded-full hover:bg-[#F7F7F5]" aria-label={t('cart')}>
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {getCartItemsCount() > 0 && (
              <span className="absolute -top-0.5 -start-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[#171717] px-1 text-[10px] font-semibold text-white">
                {getCartItemsCount() > 99 ? '99+' : getCartItemsCount()}
              </span>
            )}
          </Link>

          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="grid h-10 w-10 place-items-center rounded-full hover:bg-[#F7F7F5] lg:hidden"
            aria-label={showMobileMenu ? t('closeMenu') : t('openMenu')}
            aria-expanded={showMobileMenu}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.8}>
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {user ? (
            <div className="hidden items-center gap-2 lg:flex">
              {isAdmin && (
                <Link to="/admin" className="rounded-full px-3 py-2 text-sm font-medium hover:bg-[#F7F7F5]">{t('admin')}</Link>
              )}
              {isAdmin ? (
                <Link to="/profile" title={user?.name || t('profile')} className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#F7F7F5]">
                  {user?.image ? (
                    <img key={`${user.image}-${imageKey}`} src={getImageUrl(user.image)} alt={user.name || ''} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-semibold">{(user?.name || 'F').slice(0, 1)}</span>
                  )}
                </Link>
              ) : (
                <span title={user?.name || ''} className="grid h-10 w-10 place-items-center overflow-hidden rounded-full bg-[#F7F7F5] text-sm font-semibold">
                  {user?.image ? <img key={`${user.image}-${imageKey}`} src={getImageUrl(user.image)} alt="" className="h-full w-full object-cover" /> : (user?.name || 'F').slice(0, 1)}
                </span>
              )}
              <button type="button" onClick={handleLogout} className="rounded-full px-3 py-2 text-sm font-medium text-[#777777] hover:bg-[#F7F7F5]">
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="hidden items-center gap-2 lg:flex">
              <Link to="/login" className="shrink-0 whitespace-nowrap rounded-full px-3 py-2 text-sm font-medium hover:bg-[#F7F7F5]">{t('login')}</Link>
              <Link to="/register" className="shrink-0 whitespace-nowrap rounded-full bg-[#171717] px-4 py-2 text-sm font-semibold text-white">{t('signup')}</Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile menu backdrop + slide panel */}
      <>
        {/* Backdrop */}
        <div
          className={`lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-[70] transition-opacity duration-300 ${
            showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setShowMobileMenu(false)}
          aria-hidden="true"
        />
        {/* Slide panel */}
        <div
          className={`lg:hidden fixed top-0 bottom-0 z-[80] w-full max-w-sm overflow-y-auto bg-white shadow-2xl transition-transform duration-300 ease-out ${
            isRTL ? 'right-0' : 'left-0'
          } ${showMobileMenu ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label={t('openMenu')}
        >
          <div className={`flex flex-col h-full ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Mobile menu header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="text-lg font-bold text-gray-900">{t('homepage')}</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label={t('closeMenu')}
              >
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Search in mobile menu */}
            <div className="p-4 border-b border-gray-100">
              <form onSubmit={(e) => { handleSearch(e); setShowMobileMenu(false); }} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchProducts')}
                  className="flex-1 rounded-xl border border-black/10 px-4 py-3 text-sm outline-none focus:border-[#171717]"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <button type="submit" className="rounded-xl bg-[#171717] p-3 text-white">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </form>
            </div>

            {/* Nav links - large touch targets */}
            <nav className="flex-1 p-4 space-y-1">
              <Link
                to="/products"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-900 font-semibold hover:bg-gray-100 active:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                {t('products')}
              </Link>
              <Link
                to="/cart"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl text-gray-900 font-semibold hover:bg-gray-100 active:bg-gray-100 transition-colors"
              >
                <span className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {t('cart')}
                </span>
                {getCartItemsCount() > 0 && (
                  <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-[#171717] px-1.5 text-xs font-bold text-white">
                    {getCartItemsCount() > 99 ? '99+' : getCartItemsCount()}
                  </span>
                )}
              </Link>
              <Link
                to="/about"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('about')}
              </Link>
              <Link
                to="/contact"
                onClick={() => setShowMobileMenu(false)}
                className="flex items-center gap-3 px-4 py-3.5 rounded-xl text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                {t('contact')}
              </Link>

              {/* Categories in mobile menu */}
              <div className="pt-2 pb-1">
                <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('categories')}</p>
                <button
                  type="button"
                  onClick={() => { navigate('/products'); setShowMobileMenu(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors text-left"
                >
                  {t('allCategories')}
                </button>
                {categories.slice(0, 8).map((category) => {
                  const subcategories = categorySubcategories[category] || []
                  return (
                    <div key={category}>
                      <button
                        type="button"
                        onClick={() => { handleCategoryClick(category); setShowMobileMenu(false); }}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-100 transition-colors ${isRTL ? 'text-right flex-row-reverse' : 'text-left'}`}
                      >
                        {category}
                      </button>
                      {subcategories.slice(0, 4).map((subcategory) => (
                        <button
                          key={subcategory}
                          type="button"
                          onClick={() => { handleSubcategoryClick(category, subcategory); setShowMobileMenu(false); }}
                          className={`w-full py-2.5 px-4 ${isRTL ? 'pr-8' : 'pl-8'} text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                        >
                          {subcategory}
                        </button>
                      ))}
                    </div>
                  )
                })}
              </div>
            </nav>

            {/* User / Auth at bottom */}
            <div className="p-4 border-t border-gray-100 space-y-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                    >
                      {t('admin')}
                    </Link>
                  )}
                  <Link
                    to="/profile"
                    onClick={() => setShowMobileMenu(false)}
                    className="flex items-center gap-3 px-4 py-3.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    {t('profile')}
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setShowMobileMenu(false); }}
                    className={`flex items-center gap-3 w-full px-4 py-3.5 rounded-xl font-semibold text-red-600 hover:bg-red-50 transition-colors ${isRTL ? 'flex-row-reverse' : ''}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t('logout')}
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setShowMobileMenu(false)}
                    className="block w-full px-4 py-3.5 rounded-xl font-medium text-gray-700 hover:bg-gray-100 transition-colors text-center"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setShowMobileMenu(false)}
                    className="block w-full rounded-full bg-[#171717] px-4 py-3.5 text-center font-semibold text-white"
                  >
                    {t('signup')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </>
    </nav>
  )
}

export default Navbar
