import { createContext, useContext, useState, useEffect } from 'react'

const LanguageContext = createContext()

export const useLanguage = () => {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

const translations = {
  en: {
    // Navbar
    homepage: 'Homepage',
    category: 'Category',
    allCategories: 'All Categories',
    searchProducts: 'Search products...',
    products: 'Products',
    about: 'About',
    contact: 'Contact',
    login: 'Log in',
    signup: 'Sign up',
    logout: 'Logout',
    admin: 'Admin',
    profile: 'Profile',
    categories: 'Categories',
    cart: 'Cart',
    // Common
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    // Pages
    home: 'Home',
    shoppingCart: 'Shopping Cart',
    addToCart: 'Add to Cart',
    remove: 'Remove',
    quantity: 'Quantity',
    total: 'Total',
    checkout: 'Checkout',
    continueShopping: 'Continue Shopping',
    viewAll: 'View All',
    price: 'Price',
    description: 'Description',
    reviews: 'Reviews',
    relatedProducts: 'Related Products',
    noProductsFound: 'No products found',
    tryAdjustingFilters: 'Try adjusting your filters or search terms',
    filter: 'Filter',
    sortBy: 'Sort By',
    clearFilters: 'Clear Filters',
    product: 'product',
    available: 'available',
    page: 'Page',
    of: 'of',
    previous: 'Previous',
    next: 'Next',
    showing: 'Showing',
    to: 'to',
    outOfStock: 'Product is out of stock',
    addedToCart: 'Added to cart!',
    totalAmount: 'Total Amount',
    orderPlaced: 'Order Placed Successfully!',
    // Cart
    orderSummary: 'Order Summary',
    subtotal: 'Subtotal',
    shipping: 'Shipping',
    free: 'Free',
    proceedToCheckout: 'Proceed to Checkout',
    // Contact
    sendMessage: 'Send Message',
    sending: 'Sending...',
    contactDescription: "We'd love to hear from you. Get in touch with us!",
    name: 'Name',
    email: 'Email',
    subject: 'Subject',
    message: 'Message',
    // Admin
    dashboard: 'Dashboard',
    orders: 'Orders',
    users: 'Users',
    messages: 'Messages',
    settings: 'Settings',
    // Language names
    english: 'English',
    arabic: 'العربية',
    french: 'Français'
  },
  ar: {
    // Navbar
    homepage: 'الصفحة الرئيسية',
    category: 'الفئة',
    allCategories: 'جميع الفئات',
    searchProducts: 'البحث عن المنتجات...',
    products: 'المنتجات',
    about: 'من نحن',
    contact: 'اتصل بنا',
    login: 'تسجيل الدخول',
    signup: 'إنشاء حساب',
    logout: 'تسجيل الخروج',
    admin: 'المسؤول',
    profile: 'الملف الشخصي',
    categories: 'الفئات',
    cart: 'السلة',
    // Common
    loading: 'جاري التحميل...',
    error: 'خطأ',
    success: 'نجح',
    // Pages
    home: 'الرئيسية',
    shoppingCart: 'سلة التسوق',
    addToCart: 'أضف إلى السلة',
    remove: 'إزالة',
    quantity: 'الكمية',
    total: 'المجموع',
    checkout: 'الدفع',
    continueShopping: 'متابعة التسوق',
    viewAll: 'عرض الكل',
    price: 'السعر',
    description: 'الوصف',
    reviews: 'التقييمات',
    relatedProducts: 'منتجات ذات صلة',
    noProductsFound: 'لم يتم العثور على منتجات',
    tryAdjustingFilters: 'حاول تعديل الفلاتر أو مصطلحات البحث',
    filter: 'تصفية',
    sortBy: 'ترتيب حسب',
    clearFilters: 'مسح الفلاتر',
    product: 'منتج',
    available: 'متاح',
    page: 'صفحة',
    of: 'من',
    previous: 'السابق',
    next: 'التالي',
    showing: 'عرض',
    to: 'إلى',
    outOfStock: 'المنتج غير متوفر',
    addedToCart: 'تمت الإضافة إلى السلة!',
    totalAmount: 'المبلغ الإجمالي',
    orderPlaced: 'تم تقديم الطلب بنجاح!',
    // Cart
    orderSummary: 'ملخص الطلب',
    subtotal: 'المجموع الفرعي',
    shipping: 'الشحن',
    free: 'مجاني',
    proceedToCheckout: 'المتابعة إلى الدفع',
    // Contact
    sendMessage: 'إرسال رسالة',
    sending: 'جاري الإرسال...',
    contactDescription: 'نود أن نسمع منك. تواصل معنا!',
    name: 'الاسم',
    email: 'البريد الإلكتروني',
    subject: 'الموضوع',
    message: 'الرسالة',
    // Admin
    dashboard: 'لوحة التحكم',
    orders: 'الطلبات',
    users: 'المستخدمون',
    messages: 'الرسائل',
    settings: 'الإعدادات',
    // Language names
    english: 'English',
    arabic: 'العربية',
    french: 'Français'
  },
  fr: {
    // Navbar
    homepage: 'Accueil',
    category: 'Catégorie',
    allCategories: 'Toutes les catégories',
    searchProducts: 'Rechercher des produits...',
    products: 'Produits',
    about: 'À propos',
    contact: 'Contact',
    login: 'Se connecter',
    signup: "S'inscrire",
    logout: 'Déconnexion',
    admin: 'Administrateur',
    profile: 'Profil',
    categories: 'Catégories',
    cart: 'Panier',
    // Common
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    // Pages
    home: 'Accueil',
    shoppingCart: 'Panier',
    addToCart: 'Ajouter au panier',
    remove: 'Retirer',
    quantity: 'Quantité',
    total: 'Total',
    checkout: 'Commander',
    continueShopping: 'Continuer les achats',
    viewAll: 'Voir tout',
    price: 'Prix',
    description: 'Description',
    reviews: 'Avis',
    relatedProducts: 'Produits connexes',
    noProductsFound: 'Aucun produit trouvé',
    tryAdjustingFilters: 'Essayez d\'ajuster vos filtres ou termes de recherche',
    filter: 'Filtrer',
    sortBy: 'Trier par',
    clearFilters: 'Effacer les filtres',
    product: 'produit',
    available: 'disponible',
    page: 'Page',
    of: 'de',
    previous: 'Précédent',
    next: 'Suivant',
    showing: 'Affichage',
    to: 'à',
    outOfStock: 'Produit en rupture de stock',
    addedToCart: 'Ajouté au panier!',
    totalAmount: 'Montant total',
    orderPlaced: 'Commande passée avec succès!',
    // Cart
    orderSummary: 'Résumé de la commande',
    subtotal: 'Sous-total',
    shipping: 'Livraison',
    free: 'Gratuit',
    proceedToCheckout: 'Passer à la caisse',
    // Contact
    sendMessage: 'Envoyer un message',
    sending: 'Envoi en cours...',
    contactDescription: "Nous aimerions avoir de vos nouvelles. Contactez-nous!",
    name: 'Nom',
    email: 'Email',
    subject: 'Sujet',
    message: 'Message',
    // Admin
    dashboard: 'Tableau de bord',
    orders: 'Commandes',
    users: 'Utilisateurs',
    messages: 'Messages',
    settings: 'Paramètres',
    // Language names
    english: 'English',
    arabic: 'العربية',
    french: 'Français'
  }
}

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language')
    return saved || 'en'
  })

  useEffect(() => {
    localStorage.setItem('language', language)
    // Update document direction for RTL languages
    if (language === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl')
      document.documentElement.setAttribute('lang', 'ar')
    } else {
      document.documentElement.setAttribute('dir', 'ltr')
      document.documentElement.setAttribute('lang', language)
    }
  }, [language])

  const t = (key) => {
    return translations[language]?.[key] || key
  }

  const changeLanguage = (lang) => {
    setLanguage(lang)
  }

  const value = {
    language,
    changeLanguage,
    t,
    isRTL: language === 'ar'
  }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

