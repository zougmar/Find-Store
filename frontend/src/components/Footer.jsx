import { Link } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'

const Footer = () => {
  const { t, isRTL } = useLanguage()
  
  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {/* Brand */}
          <div className={`col-span-1 sm:col-span-2 md:col-span-2 ${isRTL ? 'text-right' : 'text-left'}`}>
            <h3 className="text-lg md:text-xl font-bold text-[#FF385C] mb-3 md:mb-4">Find Store</h3>
            <p className="text-gray-600 text-xs md:text-sm mb-4 max-w-md">
              {t('trustedMarketplace')}
            </p>
          </div>

          {/* Quick Links */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('support') || 'Support'}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('helpCenter') || 'Help Center'}
                </Link>
              </li>
              <li>
                <Link to="/products" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('browseProducts') || 'Browse Products'}
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('contactUs') || 'Contact Us'}
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className={isRTL ? 'text-right' : 'text-left'}>
            <h4 className="text-sm font-semibold text-gray-900 mb-4">{t('company') || 'Company'}</h4>
            <ul className="space-y-3">
              <li>
                <Link to="/about" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('aboutUs') || 'About Us'}
                </Link>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('careers') || 'Careers'}
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
                  {t('privacyPolicy') || 'Privacy Policy'}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className={`border-t border-gray-200 mt-6 md:mt-8 pt-6 md:pt-8 flex flex-col md:flex-row justify-between items-center gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
          <p className={`text-xs md:text-sm text-gray-600 text-center md:${isRTL ? 'text-right' : 'text-left'}`}>
            &copy; {new Date().getFullYear()} Find Store. {t('allRightsReserved') || 'All rights reserved.'}
          </p>
          <div className={`flex items-center gap-4 md:gap-6 flex-wrap justify-center ${isRTL ? 'flex-row-reverse' : ''}`}>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              {t('terms') || 'Terms'}
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              {t('privacy') || 'Privacy'}
            </a>
            <a href="#" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              {t('sitemap') || 'Sitemap'}
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
