import { useEffect, useState } from 'react'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { useAdminI18n } from '../context/AdminLanguageContext'

const emptySlots = () => [
  { productId: '', image: '' },
  { productId: '', image: '' },
  { productId: '', image: '' }
]

const HeroImageSettings = () => {
  const { t } = useAdminI18n()
  const [page, setPage] = useState(null)
  const [products, setProducts] = useState([])
  const [slots, setSlots] = useState(emptySlots)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [productRes, pageRes] = await Promise.all([
          api.get('/products?sortBy=newest'),
          api.get('/admin/pages/home').catch((error) => {
            if (error.response?.status === 404) return { data: null }
            throw error
          })
        ])
        setProducts(Array.isArray(productRes.data) ? productRes.data : [])
        const home = pageRes.data
        setPage(home)
        const hero = home?.sections?.find((section) => section.type === 'hero')
        const saved = Array.isArray(hero?.styles?.heroSlots) ? hero.styles.heroSlots : []
        setSlots(emptySlots().map((slot, index) => ({
          productId: saved[index]?.productId || '',
          image: saved[index]?.image || ''
        })))
      } catch (error) {
        toast.error(t('heroImages.saveFailed'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [t])

  const updateSlot = (index, updates) => {
    setSlots((current) => current.map((slot, slotIndex) => (
      slotIndex === index ? { ...slot, ...updates } : slot
    )))
  }

  const moveSlot = (index, direction) => {
    const target = index + direction
    if (target < 0 || target > 2) return
    setSlots((current) => {
      const next = [...current]
      const [item] = next.splice(index, 1)
      next.splice(target, 0, item)
      return next
    })
  }

  const uploadImage = async (index, file) => {
    if (!file) return
    setUploading(index)
    try {
      const formData = new FormData()
      formData.append('image', file)
      const res = await api.post('/admin/upload', formData)
      updateSlot(index, { image: res.data.imageUrl || res.data.fileUrl || '' })
    } catch (error) {
      toast.error(t('heroImages.uploadFailed'))
    } finally {
      setUploading(null)
    }
  }

  const save = async () => {
    setSaving(true)
    try {
      let home = page
      if (!home) {
        const created = await api.post('/admin/pages', {
          slug: 'home',
          title: 'Home Page',
          published: true,
          sections: [{
            id: 'hero-1',
            type: 'hero',
            title: '',
            content: '',
            order: 0,
            visible: true,
            styles: { heroSlots: slots }
          }]
        })
        setPage(created.data)
        toast.success(t('heroImages.saved'))
        return
      }

      const sections = Array.isArray(home.sections) ? [...home.sections] : []
      const heroIndex = sections.findIndex((section) => section.type === 'hero')
      if (heroIndex === -1) {
        sections.unshift({
          id: 'hero-1',
          type: 'hero',
          title: '',
          content: '',
          order: 0,
          visible: true,
          styles: { heroSlots: slots }
        })
      } else {
        const hero = sections[heroIndex]
        sections[heroIndex] = {
          ...hero,
          styles: { ...(hero.styles || {}), heroSlots: slots }
        }
      }

      const res = await api.put(`/admin/pages/${home._id}`, { ...home, sections })
      setPage(res.data)
      toast.success(t('heroImages.saved'))
    } catch (error) {
      toast.error(error.response?.data?.message || t('heroImages.saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
        <div className="h-6 w-48 animate-pulse rounded bg-gray-100" />
      </div>
    )
  }

  return (
    <section className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-900">{t('heroImages.title')}</h2>
        <p className="mt-1 text-sm leading-6 text-gray-600">{t('heroImages.subtitle')}</p>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {slots.map((slot, index) => {
          const product = products.find((item) => String(item._id) === String(slot.productId))
          const preview = slot.image || product?.images?.[0] || ''
          return (
            <div key={index} className="rounded-xl border border-gray-200 p-4">
              <p className="text-sm font-semibold text-gray-900">
                {index === 0 ? t('heroImages.large') : `${t('heroImages.small')} ${index}`}
              </p>
              <div className="mt-3 overflow-hidden rounded-lg bg-gray-100">
                {preview ? (
                  <img src={preview} alt="" className="aspect-[4/3] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center text-sm text-gray-400">FINDSTORE</div>
                )}
              </div>
              <label className="mt-3 block text-xs font-medium text-gray-600">{t('heroImages.product')}</label>
              <select
                value={slot.productId}
                onChange={(event) => {
                  const nextProduct = products.find((item) => String(item._id) === event.target.value)
                  updateSlot(index, {
                    productId: event.target.value,
                    image: nextProduct?.images?.[0] || ''
                  })
                }}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="">{t('heroImages.none')}</option>
                {products.map((item) => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
              <label className="mt-3 block text-xs font-medium text-gray-600">{t('heroImages.upload')}</label>
              <input
                type="file"
                accept="image/*"
                disabled={uploading === index}
                onChange={(event) => {
                  uploadImage(index, event.target.files?.[0])
                  event.target.value = ''
                }}
                className="mt-1 block w-full text-sm text-gray-600 file:me-3 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-semibold"
              />
              <label className="mt-3 block text-xs font-medium text-gray-600">{t('heroImages.url')}</label>
              <input
                type="text"
                dir="ltr"
                value={slot.image}
                onChange={(event) => updateSlot(index, { image: event.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => moveSlot(index, -1)} disabled={index === 0} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">{t('heroImages.earlier')}</button>
                <button type="button" onClick={() => moveSlot(index, 1)} disabled={index === 2} className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold disabled:opacity-40">{t('heroImages.later')}</button>
                <button type="button" onClick={() => updateSlot(index, { productId: '', image: '' })} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700">{t('heroImages.clear')}</button>
              </div>
            </div>
          )
        })}
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-5 w-full rounded-lg bg-[#171717] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 sm:w-auto"
      >
        {saving ? t('heroImages.saving') : t('heroImages.save')}
      </button>
    </section>
  )
}

export default HeroImageSettings
