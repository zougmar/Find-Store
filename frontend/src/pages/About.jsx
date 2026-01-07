import Footer from '../components/Footer'
import { useLanguage } from '../context/LanguageContext'

const About = () => {
  const { t, isRTL } = useLanguage()
  
  return (
    <>
      {/* Hero Section */}
      <section className="bg-white py-12 md:py-20">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className={`text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 md:mb-6 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('aboutFindStore')}
            </h1>
            <p className={`text-base md:text-xl text-gray-600 max-w-2xl mx-auto px-4 ${isRTL ? 'text-right' : 'text-left'}`}>
              {t('trustedMarketplace')}
            </p>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-lg max-w-none">
            <div className={`mb-8 md:mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">{t('ourStory')}</h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3 md:mb-4">
                {t('ourStoryText')}
              </p>
              <p className="text-gray-600 leading-relaxed">
                {t('ourStoryText2')}
              </p>
            </div>

            <div className={`mb-8 md:mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">{t('ourMission')}</h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3 md:mb-4">
                {t('ourMissionText')}
              </p>
              <ul className={`list-disc list-inside text-gray-600 space-y-2 ${isRTL ? 'mr-4' : 'ml-4'}`}>
                <li>{t('exceptionalService')}</li>
                <li>{t('productQuality')}</li>
                <li>{t('supportBusinesses')}</li>
                <li>{t('safeEnvironment')}</li>
                <li>{t('competitivePrices')}</li>
              </ul>
            </div>

            <div className={`mb-8 md:mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 md:mb-6">{t('whyChooseUs')}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-[#FF385C] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('qualityGuaranteedTitle')}</h3>
                  <p className="text-gray-600">
                    {t('qualityGuaranteedText')}
                  </p>
                </div>

                <div className="p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-[#FF385C] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('fastDeliveryTitle')}</h3>
                  <p className="text-gray-600">
                    {t('fastDeliveryText')}
                  </p>
                </div>

                <div className="p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-[#FF385C] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('secureShoppingTitle')}</h3>
                  <p className="text-gray-600">
                    {t('secureShoppingText')}
                  </p>
                </div>

                <div className="p-6 bg-gray-50 rounded-xl">
                  <div className="w-12 h-12 bg-[#FF385C] rounded-full flex items-center justify-center mb-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('support247Title')}</h3>
                  <p className="text-gray-600">
                    {t('support247Text')}
                  </p>
                </div>
              </div>
            </div>

            <div className={`mb-8 md:mb-12 ${isRTL ? 'text-right' : 'text-left'}`}>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">{t('contactUs')}</h2>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed mb-3 md:mb-4">
                {t('contactUsText')}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#FF385C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-gray-600">support@findstore.com</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-[#FF385C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="text-gray-600">+1 (555) 123-4567</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}

export default About

