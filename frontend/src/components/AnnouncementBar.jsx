import { useEffect, useState } from 'react'

const MESSAGES = [
  'توصيل متوفر لجميع مدن المغرب',
  'اطلب الآن واستفد من خدمة التوصيل',
  'منتجات مختارة بعناية من FINDSTORE'
]

const AnnouncementBar = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % MESSAGES.length)
    }, 4200)
    return () => window.clearInterval(timer)
  }, [])

  return (
    <div className="bg-[#171717] text-white">
      <p className="mx-auto max-w-6xl px-4 py-2 text-center text-xs font-medium sm:text-sm">
        {MESSAGES[index]}
      </p>
    </div>
  )
}

export default AnnouncementBar
