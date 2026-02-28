import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useLanguage } from '../context/LanguageContext'
import { USFlag, MoroccoFlag, FranceFlag } from './FlagIcons'
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
  const { language, changeLanguage, t, isRTL } = useLanguage()
  const navigate = useNavigate()
  const location = useLocation()
  const [categories, setCategories] = useState([])
  const [categorySubcategories, setCategorySubcategories] = useState({}) // { category: [subcategories] }
  const [showCategoriesMenu, setShowCategoriesMenu] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(t('category'))
  const [imageKey, setImageKey] = useState(0)
  const languageMenuRef = useRef(null)

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

  const handleHomepageClick = (e) => {
    e.stopPropagation()
    navigate('/')
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
      if (showLanguageMenu && languageMenuRef.current && !languageMenuRef.current.contains(event.target)) {
        setShowLanguageMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCategoriesMenu, showLanguageMenu])

  return (
    <nav className={`bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-[1600px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
        <div className={`flex justify-between items-center h-14 sm:h-16 md:h-[72px] ${isRTL ? 'flex-row-reverse' : ''}`}>
          {/* Logo */}
          <Link to="/" className={`flex items-center group flex-shrink-0 ${isRTL ? 'order-last' : 'order-first'}`}>
            <img
              src={logoImage}
              alt="Find Store Logo"
              className="h-9 w-9 sm:h-10 sm:w-10 md:h-11 md:w-11 rounded-full object-cover border-2 border-gray-200 group-hover:border-[#FF385C] transition-all duration-200 shadow-sm"
            />
          </Link>
          
          {/* Mobile Menu Button - visible only on small screens */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-2.5 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            aria-label={showMobileMenu ? 'Close menu' : 'Open menu'}
            aria-expanded={showMobileMenu}
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          {/* Search Bar - Desktop */}
          <div className={`hidden md:flex flex-1 max-w-2xl ${isRTL ? 'mr-6 ml-4' : 'ml-6 mr-4'}`}>
            <form
              className={`flex items-center w-full bg-gray-50 border border-gray-200 rounded-full pl-4 pr-2 py-2 shadow-sm hover:shadow-md hover:border-gray-300 focus-within:ring-2 focus-within:ring-[#FF385C]/20 focus-within:border-[#FF385C] transition-all ${isRTL ? 'flex-row-reverse' : ''}`}
              onSubmit={handleSearch}
            >
              <div
                className={`flex-1 text-center px-4 py-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer ${isRTL ? 'text-right' : 'text-left'}`}
                onClick={handleHomepageClick}
              >
                <span className="text-sm font-semibold text-gray-900">{t('homepage')}</span>
              </div>
              <div className="w-px h-6 bg-gray-200" />
              <div className={`category-dropdown-container flex-1 text-center px-4 py-2 hover:bg-gray-50 rounded-full transition-colors relative cursor-pointer ${isRTL ? 'text-right' : 'text-left'}`}>
                <div onClick={handleCategoryToggle} className="w-full">
                  <span className="text-sm font-bold text-gray-900">{selectedCategory}</span>
                </div>
                {showCategoriesMenu && (
                  <div 
                    className={`absolute top-full ${isRTL ? 'right-0' : 'left-0'} mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-96 overflow-y-auto`}
                  >
                    <button
                      type="button"
                      onClick={() => handleCategoryClick('all')}
                      className={`block w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors border-b border-gray-200`}
                    >
                      {t('allCategories')}
                    </button>
                    {categories.length > 0 ? (
                      categories.map((category) => {
                        const subcategories = categorySubcategories[category] || []
                        return (
                          <div key={category} className="border-b border-gray-100 last:border-b-0">
                            <button
                              type="button"
                              onClick={() => handleCategoryClick(category)}
                              className={`block w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors`}
                            >
                              {category}
                            </button>
                            {subcategories.length > 0 && (
                              <div className={`${isRTL ? 'pr-4' : 'pl-4'} pb-1`}>
                                {subcategories.map((subcategory) => (
                                  <button
                                    key={`${category}-${subcategory}`}
                                    type="button"
                                    onClick={() => handleSubcategoryClick(category, subcategory)}
                                    className={`block w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors`}
                                  >
                                    {isRTL ? `${subcategory} └` : `└ ${subcategory}`}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <div className="px-4 py-2 text-sm text-gray-500">No categories available</div>
                    )}
                  </div>
                )}
              </div>
              <div className="w-px h-6 bg-gray-200" />
              <div className={`flex items-center flex-1 min-w-0 px-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchProducts')}
                  className={`flex-1 min-w-0 outline-none text-sm text-gray-900 placeholder-gray-400 bg-transparent ${isRTL ? 'text-right' : 'text-left'}`}
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <button type="submit" className={`p-2 rounded-full hover:bg-gray-200 transition-colors flex-shrink-0 ${isRTL ? 'order-last' : ''}`} aria-label="Search">
                  <svg className="w-5 h-5 text-[#FF385C]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Right Menu */}
          <div className={`flex items-center gap-2 sm:gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Language - always visible */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 rounded-full hover:bg-gray-100 transition-colors border border-gray-200 hover:border-gray-300 touch-manipulation"
                aria-label="Change language"
              >
                {language === 'en' ? (
                  <USFlag className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm shadow-sm" />
                ) : language === 'ar' ? (
                  <MoroccoFlag className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm shadow-sm" />
                ) : (
                  <FranceFlag className="w-4 h-4 sm:w-5 sm:h-5 rounded-sm shadow-sm" />
                )}
                <span className="text-xs sm:text-sm font-semibold text-gray-700 uppercase hidden sm:inline">
                  {language === 'en' ? 'EN' : language === 'ar' ? 'AR' : 'FR'}
                </span>
              </button>
              
              {showLanguageMenu && (
                <div className={`absolute top-full ${isRTL ? 'left-0' : 'right-0'} mt-2 w-44 bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-[100]`}>
                  <button
                    onClick={() => {
                      changeLanguage('en')
                      setShowLanguageMenu(false)
                    }}
                    className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                      language === 'en' ? 'bg-gray-50 text-[#FF385C]' : ''
                    }`}
                  >
                    <USFlag className="w-5 h-5 rounded-sm shadow-sm" />
                    <span>{t('english')}</span>
                    {language === 'en' && (
                      <svg className={`w-4 h-4 ${isRTL ? 'mr-auto' : 'ml-auto'} text-[#FF385C]`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('ar')
                      setShowLanguageMenu(false)
                    }}
                    className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                      language === 'ar' ? 'bg-gray-50 text-[#FF385C]' : ''
                    }`}
                  >
                    <MoroccoFlag className="w-5 h-5 rounded-sm shadow-sm" />
                    <span>{t('arabic')}</span>
                    {language === 'ar' && (
                      <svg className={`w-4 h-4 ${isRTL ? 'mr-auto' : 'ml-auto'} text-[#FF385C]`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      changeLanguage('fr')
                      setShowLanguageMenu(false)
                    }}
                    className={`w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors flex items-center gap-2 ${
                      language === 'fr' ? 'bg-gray-50 text-[#FF385C]' : ''
                    }`}
                  >
                    <FranceFlag className="w-5 h-5 rounded-sm shadow-sm" />
                    <span>{t('french')}</span>
                    {language === 'fr' && (
                      <svg className={`w-4 h-4 ${isRTL ? 'mr-auto' : 'ml-auto'} text-[#FF385C]`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Categories dropdown - only in search bar (desktop) and slide menu (mobile) */}
            <div className="hidden relative category-dropdown-container">
              <button
                onClick={() => setShowCategoriesMenu(!showCategoriesMenu)}
                className="text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <span className="hidden sm:inline">{t('categories')}</span>
                <span className="sm:hidden">{t('category')}</span>
              </button>
              {showCategoriesMenu && categories.length > 0 && (
                <div className={`absolute top-full ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 sm:w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50 max-h-[70vh] overflow-y-auto`}>
                  <button
                    type="button"
                    onClick={() => handleCategoryClick('all')}
                    className={`block w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors border-b border-gray-200`}
                  >
                    {t('allCategories')}
                  </button>
                  {categories.map((category) => {
                    const subcategories = categorySubcategories[category] || []
                    return (
                      <div key={category} className="border-b border-gray-100 last:border-b-0">
                        <button
                          type="button"
                          onClick={() => handleCategoryClick(category)}
                          className="block w-full text-left px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-100 transition-colors"
                        >
                          {category}
                        </button>
                        {subcategories.length > 0 && (
                          <div className={`${isRTL ? 'pr-4' : 'pl-4'} pb-1`}>
                            {subcategories.map((subcategory) => (
                              <button
                                key={`${category}-${subcategory}`}
                                type="button"
                                onClick={() => handleSubcategoryClick(category, subcategory)}
                                className={`block w-full ${isRTL ? 'text-right' : 'text-left'} px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors`}
                              >
                                {isRTL ? `${subcategory} └` : `└ ${subcategory}`}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {user ? (
              <>
                <Link
                  to="/products"
                  className={`hidden md:block text-sm font-bold text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {t('products')}
                </Link>
                <Link
                  to="/about"
                  className={`hidden md:block text-sm font-bold text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {t('about')}
                </Link>
                <Link
                  to="/contact"
                  className={`hidden md:block text-sm font-bold text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors ${isRTL ? 'text-right' : 'text-left'}`}
                >
                  {t('contact')}
                </Link>
                
                <Link
                  to="/cart"
                  className="relative p-1.5 sm:p-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  aria-label="Shopping cart"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  {getCartItemsCount() > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 sm:top-0 sm:right-0 bg-[#FF385C] text-white text-[10px] sm:text-xs font-semibold rounded-full h-4 w-4 sm:h-5 sm:w-5 flex items-center justify-center">
                      {getCartItemsCount() > 99 ? '99+' : getCartItemsCount()}
                    </span>
                  )}
                </Link>

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="hidden md:block text-sm font-bold text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    {t('admin')}
                  </Link>
                )}

                {/* User Menu */}
                <div className={`flex items-center gap-2 sm:gap-3 ${isRTL ? 'pr-2 sm:pr-4 border-r border-l-0' : 'pl-2 sm:pl-4 border-l border-r-0'} border-gray-300 ${isRTL ? 'flex-row-reverse' : ''}`}>
                  {isAdmin ? (
                    <Link
                      to="/profile"
                      className="relative flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 group"
                      title={user?.name || 'Profile'}
                    >
                      {user?.image && user.image.trim() !== '' ? (
                        <div className="relative">
                          <img
                            key={`${user.image}-${imageKey}`}
                            src={getImageUrl(user.image)}
                            alt={user.name || 'User'}
                            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 sm:border-[3px] border-white shadow-lg ring-1 sm:ring-2 ring-gray-200 group-hover:ring-[#FF385C] transition-all duration-200"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              const fallback = e.target.parentElement.parentElement.querySelector('.profile-fallback')
                              if (fallback) fallback.style.display = 'flex'
                            }}
                          />
                          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                        </div>
                      ) : (
                        <div className="profile-fallback w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg ring-1 sm:ring-2 ring-gray-200 group-hover:ring-[#FF385C] transition-all duration-200">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </Link>
                  ) : (
                    <div
                      className="relative flex items-center justify-center"
                      title={user?.name || 'User'}
                    >
                      {user?.image && user.image.trim() !== '' ? (
                        <div className="relative">
                          <img
                            key={`${user.image}-${imageKey}`}
                            src={getImageUrl(user.image)}
                            alt={user.name || 'User'}
                            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full object-cover border-2 sm:border-[3px] border-white shadow-lg ring-1 sm:ring-2 ring-gray-200"
                          />
                        </div>
                      ) : (
                        <div className="profile-fallback w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center shadow-lg ring-1 sm:ring-2 ring-gray-200">
                          <svg className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                <button
                  onClick={handleLogout}
                  className={`hidden md:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 border border-red-200 hover:border-red-300 ${isRTL ? 'flex-row-reverse' : ''}`}
                  title={t('logout')}
                >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>{t('logout')}</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/products"
                  className="hidden md:block text-sm font-bold text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {t('products')}
                </Link>
                <Link
                  to="/about"
                  className="hidden md:block text-sm font-bold text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {t('about')}
                </Link>
                <Link
                  to="/contact"
                  className="hidden md:block text-sm font-bold text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {t('contact')}
                </Link>
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-medium text-gray-700 hover:text-gray-900 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  className="text-xs sm:text-sm font-semibold text-white bg-[#FF385C] hover:bg-[#E61E4D] active:bg-[#D91A47] px-3 sm:px-4 md:px-5 py-1.5 sm:py-2 md:py-2.5 rounded-full transition-colors"
                >
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile menu backdrop + slide panel */}
      <>
        {/* Backdrop */}
        <div
          className={`md:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${
            showMobileMenu ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setShowMobileMenu(false)}
          aria-hidden="true"
        />
        {/* Slide panel */}
        <div
          className={`md:hidden fixed top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 overflow-y-auto transition-transform duration-300 ease-out ${
            isRTL ? 'right-0' : 'left-0'
          } ${showMobileMenu ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'}`}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className={`flex flex-col h-full ${isRTL ? 'text-right' : 'text-left'}`} dir={isRTL ? 'rtl' : 'ltr'}>
            {/* Mobile menu header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <span className="text-lg font-bold text-gray-900">{t('homepage')}</span>
              <button
                onClick={() => setShowMobileMenu(false)}
                className="p-2.5 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Close menu"
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
                  className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#FF385C]/20 focus:border-[#FF385C] outline-none text-sm"
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
                <button type="submit" className="p-3 rounded-xl bg-[#FF385C] text-white">
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
                  <span className="bg-[#FF385C] text-white text-xs font-bold rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
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
                    className="block w-full px-4 py-3.5 rounded-xl font-semibold text-white bg-[#FF385C] hover:bg-[#E61E4D] transition-colors text-center"
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
