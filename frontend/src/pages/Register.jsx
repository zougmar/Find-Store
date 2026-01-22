import { useState, useEffect } from 'react'
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
  const [oauthLoading, setOauthLoading] = useState({ google: false, facebook: false })
  const { register, registerWithGoogle, registerWithFacebook } = useAuth()
  const { t, isRTL } = useLanguage()
  const navigate = useNavigate()

  // Initialize Google OAuth
  useEffect(() => {
    const initGoogle = () => {
      if (window.google && window.google.accounts) {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
        if (clientId) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
          })
          
        }
      }
    }

    if (window.google) {
      initGoogle()
    } else {
      const checkGoogle = setInterval(() => {
        if (window.google) {
          initGoogle()
          clearInterval(checkGoogle)
        }
      }, 100)
      return () => clearInterval(checkGoogle)
    }
  }, [isRTL])

  // Initialize Facebook SDK
  useEffect(() => {
    const initFacebook = () => {
      if (window.FB) {
        const appId = import.meta.env.VITE_FACEBOOK_APP_ID
        if (appId) {
          window.FB.init({
            appId: appId,
            cookie: true,
            xfbml: true,
            version: 'v18.0'
          })
        }
      }
    }

    if (window.FB) {
      initFacebook()
    } else {
      const checkFB = setInterval(() => {
        if (window.FB) {
          initFacebook()
          clearInterval(checkFB)
        }
      }, 100)
      return () => clearInterval(checkFB)
    }
  }, [])

  const handleGoogleResponse = async (response) => {
    try {
      setOauthLoading(prev => ({ ...prev, google: true }))
      
      // Decode the JWT token to get user info
      const payload = JSON.parse(atob(response.credential.split('.')[1]))
      
      await registerWithGoogle(
        payload.sub, // Google ID
        payload.email,
        payload.name,
        payload.picture || ''
      )
      navigate('/')
    } catch (error) {
      console.error('Google sign in error:', error)
    } finally {
      setOauthLoading(prev => ({ ...prev, google: false }))
    }
  }

  const handleGoogleSignIn = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) {
      alert('Google OAuth is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.')
      return
    }

    try {
      setOauthLoading(prev => ({ ...prev, google: true }))
      
      if (window.google && window.google.accounts) {
        // Use Google Identity Services
        const client = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile',
          callback: async (tokenResponse) => {
            try {
              // Get user info from Google
              const userInfoResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenResponse.access_token}`)
              const userInfo = await userInfoResponse.json()
              
              await registerWithGoogle(
                userInfo.id,
                userInfo.email,
                userInfo.name,
                userInfo.picture || ''
              )
              navigate('/')
            } catch (error) {
              console.error('Google sign in error:', error)
            } finally {
              setOauthLoading(prev => ({ ...prev, google: false }))
            }
          }
        })
        client.requestAccessToken()
      } else {
        // Fallback: use popup window
        const width = 500
        const height = 600
        const left = window.screen.width / 2 - width / 2
        const top = window.screen.height / 2 - height / 2
        const redirectUri = encodeURIComponent(window.location.origin)
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`
        
        const popup = window.open(url, 'Google Sign In', `width=${width},height=${height},left=${left},top=${top}`)
        
        // Listen for OAuth callback
        const checkPopup = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkPopup)
            setOauthLoading(prev => ({ ...prev, google: false }))
          }
        }, 1000)
      }
    } catch (error) {
      console.error('Google OAuth error:', error)
      setOauthLoading(prev => ({ ...prev, google: false }))
    }
  }

  const handleFacebookSignIn = () => {
    const appId = import.meta.env.VITE_FACEBOOK_APP_ID
    if (!appId) {
      alert('Facebook OAuth is not configured. Please set VITE_FACEBOOK_APP_ID in your .env file.')
      return
    }

    if (window.FB) {
      setOauthLoading(prev => ({ ...prev, facebook: true }))
      window.FB.login(async (response) => {
        if (response.authResponse) {
          try {
            // Get user info from Facebook
            window.FB.api('/me', { fields: 'name,email,picture' }, async (userInfo) => {
              try {
                if (!userInfo.email) {
                  throw new Error('Email permission is required. Please grant email access.')
                }
                await registerWithFacebook(
                  response.authResponse.userID,
                  userInfo.email,
                  userInfo.name,
                  userInfo.picture?.data?.url || ''
                )
                navigate('/')
              } catch (error) {
                console.error('Facebook sign in error:', error)
              } finally {
                setOauthLoading(prev => ({ ...prev, facebook: false }))
              }
            })
          } catch (error) {
            console.error('Facebook API error:', error)
            setOauthLoading(prev => ({ ...prev, facebook: false }))
          }
        } else {
          setOauthLoading(prev => ({ ...prev, facebook: false }))
        }
      }, { scope: 'email,public_profile' })
    } else {
      alert('Facebook SDK is not loaded. Please wait a moment and try again.')
    }
  }

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

              {/* Social Sign Up Buttons */}
              <div className="space-y-3 mb-6">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={oauthLoading.google}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {oauthLoading.google ? (
                    <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  )}
                  <span className="text-sm md:text-base font-semibold text-gray-700">
                    {oauthLoading.google ? (t('loading') || 'Loading...') : (t('signUpWithGoogle') || 'Sign up with Google')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleFacebookSignIn}
                  disabled={oauthLoading.facebook}
                  className={`w-full flex items-center justify-center gap-3 px-4 py-3.5 border-2 border-gray-200 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${isRTL ? 'flex-row-reverse' : ''}`}
                >
                  {oauthLoading.facebook ? (
                    <svg className="animate-spin h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="#1877F2" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  <span className="text-sm md:text-base font-semibold text-gray-700">
                    {oauthLoading.facebook ? (t('loading') || 'Loading...') : (t('signUpWithFacebook') || 'Sign up with Facebook')}
                  </span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">
                    {t('or') || 'or'}
                  </span>
                </div>
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

