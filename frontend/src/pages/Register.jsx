import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import logoImage from '../images/logo.png'

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const { t, isRTL } = useLanguage()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await register(formData.name, formData.email, formData.password, formData.phone)
      navigate('/')
    } catch (error) {
      // Error handled in context
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Register Form */}
      <div className="flex items-center justify-center min-h-screen py-8 md:py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
            {/* Logo inside the form */}
            <div className="flex justify-center pt-8 pb-4 bg-gradient-to-b from-gray-50 to-white">
              <Link to="/" className="flex items-center justify-center transition-transform hover:scale-105 duration-200">
                <img 
                  src={logoImage} 
                  alt="Find Store Logo" 
                  className="h-28 md:h-36 lg:h-40 w-auto object-contain drop-shadow-sm"
                />
              </Link>
            </div>
            
            <div className="px-8 md:px-10 pb-8 md:pb-10">
              <div className={`text-center mb-8 ${isRTL ? 'text-right' : 'text-left'}`}>
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
                  {t('createAccount')}
                </h2>
                <p className="text-sm md:text-base text-gray-500 font-medium">
                  {t('joinUs')}
                </p>
              </div>
              
              <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className={`block text-sm font-semibold text-gray-700 mb-2.5 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('fullNameLabel')}
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all text-sm md:text-base bg-gray-50 focus:bg-white ${isRTL ? 'text-right' : 'text-left'}`}
                  placeholder={t('placeholderName') || 'John Doe'}
                />
              </div>
              
              <div>
                <label htmlFor="email" className={`block text-sm font-semibold text-gray-700 mb-2.5 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('emailAddress')}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all text-sm md:text-base bg-gray-50 focus:bg-white ${isRTL ? 'text-right' : 'text-left'}`}
                  placeholder={t('placeholderEmail') || 'you@example.com'}
                  dir="ltr"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className={`block text-sm font-semibold text-gray-700 mb-2.5 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('phoneOptional')} <span className="text-gray-500 font-normal text-xs">{t('phoneOptionalNote')}</span>
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all text-sm md:text-base bg-gray-50 focus:bg-white"
                  placeholder={t('placeholderPhone') || '+1 (555) 123-4567'}
                />
              </div>
              
              <div>
                <label htmlFor="password" className={`block text-sm font-semibold text-gray-700 mb-2.5 ${isRTL ? 'text-right' : 'text-left'}`}>
                  {t('password')}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF385C] focus:border-[#FF385C] transition-all text-sm md:text-base bg-gray-50 focus:bg-white"
                  placeholder={t('minimumCharacters') || 'Minimum 6 characters'}
                />
                <p className={`mt-2 text-xs text-gray-500 font-medium ${isRTL ? 'text-right' : 'text-left'}`}>{t('minimumCharacters')}</p>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-[#FF385C] to-[#E61E4D] hover:from-[#E61E4D] hover:to-[#D91A47] disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.01] disabled:transform-none text-sm md:text-base"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t('creatingAccount')}
                    </span>
                  ) : (
                    t('createAccountButton')
                  )}
                </button>
              </div>

              <div className={`text-center pt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-sm text-gray-600">
                  {t('alreadyHaveAccount')}{' '}
                  <Link to="/login" className="font-semibold text-[#FF385C] hover:text-[#E61E4D] transition-colors underline-offset-2 hover:underline">
                    {t('signInLink')}
                  </Link>
                </p>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register

