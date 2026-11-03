import { Link } from 'react-router-dom'
import Footer from '../components/Footer'
import { useLanguage } from '../context/LanguageContext'
import usePageMeta from '../hooks/usePageMeta'

const WHATSAPP_PHONE = '212707625535'

const About = () => {
  const { t } = useLanguage()

  usePageMeta({
    title: `${t('aboutFindStore')} | FINDSTORE`,
    description: t('trustedMarketplace'),
    url: `${window.location.origin}/about`
  })

  const reasons = [
    { title: t('qualityGuaranteedTitle'), text: t('qualityGuaranteedText') },
    { title: t('fastDeliveryTitle'), text: t('fastDeliveryText') },
    { title: t('secureShoppingTitle'), text: t('secureShoppingText') },
    { title: t('support247Title'), text: t('support247Text') }
  ]

  const mission = [
    t('exceptionalService'),
    t('productQuality'),
    t('supportBusinesses'),
    t('safeEnvironment'),
    t('competitivePrices')
  ]

  return (
    <div className="bg-white text-[#242424]" dir="rtl">
      <section className="bg-[#F6F4F1]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <p className="text-sm font-semibold tracking-[0.18em] text-[#D97736]">FINDSTORE</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight sm:text-6xl">{t('aboutFindStore')}</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#5c5c5c]">{t('trustedMarketplace')}</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
        <article className="rounded-[28px] bg-[#F7F7F5] p-6 sm:p-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">{t('ourStory')}</h2>
          <p className="mt-4 leading-8 text-[#555]">{t('ourStoryText')}</p>
          <p className="mt-4 leading-8 text-[#555]">{t('ourStoryText2')}</p>
        </article>
        <article className="rounded-[28px] bg-[#171717] p-6 text-white sm:p-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">{t('ourMission')}</h2>
          <p className="mt-4 leading-8 text-white/75">{t('ourMissionText')}</p>
          <ul className="mt-6 space-y-3">
            {mission.map((item) => (
              <li key={item} className="flex items-start gap-3 leading-7">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#D97736]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </article>
      </section>

      <section className="bg-[#F7F7F5] py-14">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-semibold sm:text-3xl">{t('whyChooseUs')}</h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {reasons.map((reason) => (
              <article key={reason.title} className="rounded-[28px] bg-white p-6 shadow-sm">
                <span className="mb-4 block h-2 w-2 rounded-full bg-[#D97736]" />
                <h3 className="text-xl font-semibold">{reason.title}</h3>
                <p className="mt-3 leading-8 text-[#555]">{reason.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto grid max-w-6xl gap-8 rounded-[32px] bg-[#171717] px-6 py-10 text-white sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <h2 className="text-3xl font-semibold">{t('contactUs')}</h2>
            <p className="mt-4 max-w-xl leading-8 text-white/70">{t('contactUsText')}</p>
            <div className="mt-6 space-y-2 text-sm text-white/80">
              <p>{t('contactCity')}</p>
              <p dir="ltr" className="text-right">+212 707625535</p>
              <p>{t('contactHours')}</p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link to="/contact" className="inline-flex h-12 items-center justify-center rounded-full bg-white px-6 font-semibold text-[#171717]">
              {t('contactUs')}
            </Link>
            <a
              href={`https://wa.me/${WHATSAPP_PHONE}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#25D366] px-6 font-semibold text-white"
            >
              {t('contactViaWhatsApp')}
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default About
