import { useState, useRef, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext'

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: 'مرحبا! 👋 أنا مساعدك الافتراضي. كيف يمكنني مساعدتك اليوم؟',
      sender: 'bot',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const messagesEndRef = useRef(null)
  const { isRTL } = useLanguage()

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Bot responses in Arabic
  const getBotResponse = (userMessage) => {
    const message = userMessage.toLowerCase().trim()

    // Greetings
    if (message.includes('مرحبا') || message.includes('السلام') || message.includes('أهلا') || message.includes('hello') || message.includes('hi')) {
      return 'مرحبا بك! 😊 كيف يمكنني مساعدتك اليوم؟'
    }

    // Products
    if (message.includes('منتج') || message.includes('منتجات') || message.includes('شراء') || message.includes('product') || message.includes('buy')) {
      return 'يمكنك تصفح جميع منتجاتنا من صفحة المنتجات. هل تريد معرفة المزيد عن منتج معين؟'
    }

    // Price
    if (message.includes('سعر') || message.includes('ثمن') || message.includes('تكلفة') || message.includes('price') || message.includes('cost')) {
      return 'الأسعار تختلف حسب المنتج. يمكنك الاطلاع على الأسعار في صفحة المنتجات. هل تريد معرفة سعر منتج محدد؟'
    }

    // Delivery
    if (message.includes('توصيل') || message.includes('شحن') || message.includes('delivery') || message.includes('shipping')) {
      return 'نوفر خدمة التوصيل لجميع المناطق. يمكنك التواصل معنا عبر واتساب لمعرفة تفاصيل التوصيل والتكاليف.'
    }

    // Contact
    if (message.includes('اتصال') || message.includes('تواصل') || message.includes('رقم') || message.includes('contact') || message.includes('phone')) {
      return 'يمكنك التواصل معنا عبر:\n📱 واتساب: +212 707625535\n📧 البريد الإلكتروني: support@findstore.com\n\nهل تريد مساعدة أخرى؟'
    }

    // Help
    if (message.includes('مساعدة') || message.includes('مساعدة') || message.includes('help') || message.includes('support')) {
      return 'أنا هنا لمساعدتك! يمكنني الإجابة على أسئلتك حول:\n• المنتجات والأسعار\n• التوصيل والشحن\n• طرق الدفع\n• معلومات التواصل\n\nما الذي تريد معرفته؟'
    }

    // Payment
    if (message.includes('دفع') || message.includes('دفعة') || message.includes('payment') || message.includes('pay')) {
      return 'نقبل طرق دفع متعددة:\n💳 الدفع عند الاستلام\n💳 البطاقات الائتمانية\n💳 المحافظ الإلكترونية\n\nهل تريد معرفة المزيد؟'
    }

    // Order
    if (message.includes('طلب') || message.includes('طلبية') || message.includes('order')) {
      return 'يمكنك إضافة المنتجات إلى السلة والشراء مباشرة من الموقع. هل تحتاج مساعدة في إتمام الطلب؟'
    }

    // Default response
    return 'شكرا لك على رسالتك! 😊 يمكنني مساعدتك في:\n• معلومات المنتجات\n• الأسعار\n• التوصيل\n• طرق الدفع\n• التواصل معنا\n\nما الذي تريد معرفته؟'
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (!inputMessage.trim()) return

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')

    // Simulate bot thinking
    setTimeout(() => {
      const botResponse = {
        id: messages.length + 2,
        text: getBotResponse(inputMessage),
        sender: 'bot',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botResponse])
    }, 500)
  }

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('ar-EG', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  return (
    <>
      {/* Chatbot Toggle Button */}
      <div className="fixed right-6 bottom-6 z-50">
        {/* Notification Badge */}
        {!isOpen && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-lg animate-bounce">
            !
          </div>
        )}
        
        {/* Message Bubble Tooltip */}
        {!isOpen && (
          <div className="absolute bottom-full right-0 mb-3 w-48 sm:w-56 bg-white rounded-lg shadow-xl border border-gray-200 p-3 animate-fade-in">
            <div className="flex items-start gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97c1.31.61 2.75.97 4.29.97 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.35-3.81-.96L4 20l.96-4.19C4.35 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
                  <circle cx="8.5" cy="11.5" r="1.5" fill="white"/>
                  <circle cx="12" cy="11.5" r="1.5" fill="white"/>
                  <circle cx="15.5" cy="11.5" r="1.5" fill="white"/>
                </svg>
              </div>
              <div className="flex-1" dir="rtl">
                <p className="text-sm font-semibold text-gray-900 mb-1">مرحبا! 👋</p>
                <p className="text-xs text-gray-600 leading-relaxed">
                  أنا هنا لمساعدتك! اضغط للدردشة معي
                </p>
              </div>
            </div>
            {/* Arrow pointing down */}
            <div className="absolute bottom-0 right-6 transform translate-y-1/2 rotate-45 w-3 h-3 bg-white border-r border-b border-gray-200"></div>
          </div>
        )}

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 flex items-center justify-center group hover:scale-110 active:scale-95"
          aria-label="فتح الدردشة"
        >
          {isOpen ? (
            <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97c1.31.61 2.75.97 4.29.97 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.35-3.81-.96L4 20l.96-4.19C4.35 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
              <circle cx="8.5" cy="11.5" r="1.5" fill="white"/>
              <circle cx="12" cy="11.5" r="1.5" fill="white"/>
              <circle cx="15.5" cy="11.5" r="1.5" fill="white"/>
            </svg>
          )}
          {/* Pulse animation */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-20"></span>
          )}
        </button>
      </div>

      {/* Chatbot Window */}
      {isOpen && (
        <div className="fixed right-6 bottom-20 sm:bottom-24 z-50 w-[calc(100vw-3rem)] sm:w-96 h-[500px] sm:h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.54.36 2.98.97 4.29L1 23l6.71-1.97c1.31.61 2.75.97 4.29.97 5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18c-1.38 0-2.68-.35-3.81-.96L4 20l.96-4.19C4.35 14.68 4 13.38 4 12c0-4.41 3.59-8 8-8s8 3.59 8 8-3.59 8-8 8z"/>
                  <circle cx="8.5" cy="11.5" r="1.5" fill="white"/>
                  <circle cx="12" cy="11.5" r="1.5" fill="white"/>
                  <circle cx="15.5" cy="11.5" r="1.5" fill="white"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg">مساعدك الافتراضي</h3>
                <p className="text-xs text-blue-100">متصل الآن</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              aria-label="إغلاق"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4" dir="rtl">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-sm'
                      : 'bg-white text-gray-800 rounded-tl-sm shadow-sm border border-gray-200'
                  }`}
                >
                  <p className="text-sm whitespace-pre-line">{message.text}</p>
                  <p className={`text-xs mt-1 ${message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'}`}>
                    {formatTime(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions */}
          <div className="px-4 py-2 bg-white border-t border-gray-200">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['المنتجات', 'الأسعار', 'التوصيل', 'التواصل'].map((action) => (
                <button
                  key={action}
                  onClick={() => {
                    setInputMessage(action)
                    setTimeout(() => {
                      const form = document.querySelector('form')
                      if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }))
                    }, 100)
                  }}
                  className="flex-shrink-0 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="اكتب رسالتك هنا..."
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                dir="rtl"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="w-10 h-10 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
                aria-label="إرسال"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

export default Chatbot
