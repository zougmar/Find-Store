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
  if (!imagePath || imagePath.trim() === '') {
    console.log('getImageUrl: No image path provided')
    return null
  }
  
  // If it's already a full URL, return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    console.log('getImageUrl: Full URL detected:', imagePath)
    return imagePath
  }
  
  // If it starts with /uploads, Vite proxy will handle it directly
  if (imagePath.startsWith('/uploads/')) {
    const url = imagePath // Vite proxy handles /uploads directly
    console.log('getImageUrl: Upload path detected:', imagePath, '->', url)
    return url
  }
  
  // Otherwise, assume it's a relative path
  const url = imagePath.startsWith('/') ? imagePath : `/uploads/${imagePath}`
  console.log('getImageUrl: Relative path:', imagePath, '->', url)
  return url
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
      console.log('User update event received, refreshing user data...')
      setImageKey(prev => prev + 1)
      // Refresh user data from AuthContext
      if (fetchUser) {
        await fetchUser()
      }
    }
    window.addEventListener('userUpdated', handleUserUpdate)
    return () => window.removeEventListener('userUpdated', handleUserUpdate)
  }, [fetchUser])

  // Debug: Log user data when it changes
  useEffect(() => {
    if (user) {
      console.log('Navbar - User data:', { 
        name: user.name, 
        email: user.email, 
        image: user.image,
        hasImage: !!user.image && user.image.trim() !== ''
      })
    }
  }, [user])

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
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center group flex-shrink-0">
            <div className="relative">
              <img 
                src={logoImage} 
                alt="Find Store Logo" 
                className="h-8 w-8 sm:h-10 sm:w-10 md:h-12 md:w-12 lg:h-14 lg:w-14 rounded-full object-cover border-2 border-gray-200 group-hover:border-[#FF385C] transition-all duration-200 shadow-sm group-hover:shadow-md"
              />
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-transparent via-transparent to-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
            </div>
          </Link>
          
          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors ml-2"
            aria-label="Toggle menu"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {showMobileMenu ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          {/* Search Bar (Airbnb style) - Functional */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <form 
              className="flex items-center w-full border border-gray-300 rounded-full px-2 py-1 shadow-sm hover:shadow-md transition-all bg-white"
              onSubmit={handleSearch}
            >
              <div 
                className="flex-1 text-center px-4 py-2 hover:bg-gray-50 rounded-full transition-colors cursor-pointer"
                onClick={handleHomepageClick}
              >
                <span className="text-sm font-bold text-gray-900">{t('homepage')}</span>
              </div>
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="category-dropdown-container flex-1 text-center px-4 py-2 hover:bg-gray-50 rounded-full transition-colors relative cursor-pointer">
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
              <div className="w-px h-6 bg-gray-300"></div>
              <div className="flex items-center flex-1 px-4">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t('searchProducts')}
                  className="flex-1 outline-none text-sm text-gray-900 placeholder-gray-500"
                />
                <button
                  type="submit"
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <svg className="w-5 h-5 text-[#FF385C]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          {/* Right Menu */}
          <div className={`flex items-center gap-1.5 sm:gap-2 md:gap-3 lg:gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
            {/* Language Selector */}
            <div className="relative" ref={languageMenuRef}>
              <button
                onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-colors border border-gray-200 hover:border-gray-300"
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
                <div className={`absolute top-full ${isRTL ? 'left-0' : 'right-0'} mt-2 w-40 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50`}>
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

            {/* Categories Dropdown for Mobile/Tablet */}
            <div className="md:hidden relative">
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
                          <div className="pl-4 pb-1">
                            {subcategories.map((subcategory) => (
                              <button
                                key={`${category}-${subcategory}`}
                                type="button"
                                onClick={() => handleSubcategoryClick(category, subcategory)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                              >
                                └ {subcategory}
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
                  className="hidden md:block text-sm font-bold text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  Products
                </Link>
                <Link
                  to="/about"
                  className="hidden md:block text-sm font-bold text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className="hidden md:block text-sm font-bold text-gray-900 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
                >
                  Contact
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
                <div className={`flex items-center gap-2 sm:gap-3 ${isRTL ? 'pr-2 sm:pr-4 border-r border-l-0 border-r' : 'pl-2 sm:pl-4 border-l'} border-gray-300`}>
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
                              console.error('Image load error - Original path:', user.image, 'Resolved URL:', getImageUrl(user.image))
                              e.target.style.display = 'none'
                              const fallback = e.target.parentElement.parentElement.querySelector('.profile-fallback')
                              if (fallback) fallback.style.display = 'flex'
                            }}
                            onLoad={() => console.log('Image loaded successfully - Original path:', user.image, 'Resolved URL:', getImageUrl(user.image))}
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
                    className="hidden md:flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition-all duration-200 border border-red-200 hover:border-red-300"
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
      
      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white max-h-[calc(100vh-3.5rem)] overflow-y-auto">
          <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-1 sm:space-y-2">
            <Link
              to="/products"
              onClick={() => setShowMobileMenu(false)}
              className="block px-3 sm:px-4 py-2 text-sm font-bold text-gray-900 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
            >
              {t('products')}
            </Link>
            <Link
              to="/about"
              onClick={() => setShowMobileMenu(false)}
              className="block px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
            >
              {t('about')}
            </Link>
            <Link
              to="/contact"
              onClick={() => setShowMobileMenu(false)}
              className="block px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
            >
              {t('contact')}
            </Link>
            {user ? (
              <>
                {isAdmin && (
                  <>
                    <Link
                      to="/admin"
                      onClick={() => setShowMobileMenu(false)}
                      className="block px-3 sm:px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                    >
                      {t('admin')}
                    </Link>
                    <Link
                      to="/profile"
                      onClick={() => setShowMobileMenu(false)}
                      className="block px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                    >
                      {t('profile')}
                    </Link>
                  </>
                )}
                <button
                  onClick={() => {
                    handleLogout()
                    setShowMobileMenu(false)
                  }}
                  className="flex items-center gap-2 w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold text-red-600 hover:text-red-700 active:text-red-800 hover:bg-red-50 active:bg-red-100 rounded-lg transition-all duration-200 border border-red-200 hover:border-red-300 mt-2"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>{t('logout')}</span>
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-3 sm:px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 active:bg-gray-200 rounded-lg transition-colors"
                >
                  {t('login')}
                </Link>
                <Link
                  to="/register"
                  onClick={() => setShowMobileMenu(false)}
                  className="block px-3 sm:px-4 py-2 text-sm font-semibold text-white bg-[#FF385C] hover:bg-[#E61E4D] active:bg-[#D91A47] rounded-lg transition-colors text-center"
                >
                  {t('signup')}
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar
