import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import logoImage from '../images/logo.png'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const { login } = useAuth()
  const { t, isRTL } = useLanguage()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await login(formData.email, formData.password)
      navigate('/')
    } catch (error) {
      // Error handled in context
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Login Form */}
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
                  {t('welcomeBack')}
                </h2>
                <p className="text-sm md:text-base text-gray-500 font-medium">
                  {t('signInContinue')}
                </p>
              </div>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
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
                    placeholder={t('placeholderPassword') || 'Enter your password'}
                  />
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-[#FF385C] to-[#E61E4D] hover:from-[#E61E4D] hover:to-[#D91A47] text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.01] text-sm md:text-base"
                  >
                    {t('signIn')}
                  </button>
                </div>

                <div className={`text-center pt-2 ${isRTL ? 'text-right' : 'text-left'}`}>
                  <p className="text-sm text-gray-600">
                    {t('dontHaveAccount')}{' '}
                    <Link to="/register" className="font-semibold text-[#FF385C] hover:text-[#E61E4D] transition-colors underline-offset-2 hover:underline">
                      {t('createOne')}
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

export default Login

