import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Privacy() {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const s1Items = t('privacy.s1Items', { returnObjects: true })
  const s1OrderItems = t('privacy.s1OrderItems', { returnObjects: true })
  const s2Items = t('privacy.s2Items', { returnObjects: true })

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-[#1A1A1A]">{t('privacy.pageTitle')}</h2>
        <div className="w-5" />
      </header>

      <main className="flex-1 px-6 pb-16">
        <div className="max-w-lg mx-auto space-y-8">

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('privacy.s1Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('privacy.s1Intro')}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#4A4A4A]">
              {s1Items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#ACACAC] mt-1.5 w-1 h-1 rounded-full bg-[#ACACAC] flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-sm text-[#4A4A4A] leading-relaxed mt-2">
              {t('privacy.s1OrderIntro')}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#4A4A4A]">
              {s1OrderItems.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#ACACAC] mt-1.5 w-1 h-1 rounded-full bg-[#ACACAC] flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('privacy.s2Title')}</h3>
            <ul className="space-y-1 text-sm text-[#4A4A4A]">
              {s2Items.map((item, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-[#ACACAC] mt-1.5 w-1 h-1 rounded-full bg-[#ACACAC] flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('privacy.s3Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('privacy.s3Content')}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('privacy.s4Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('privacy.s4Intro')}
            </p>
            <div className="mt-2 bg-[#F7F7F5] rounded-lg p-3">
              <p className="text-xs font-semibold text-[#1A1A1A] mb-1">{t('privacy.s4Provider')}</p>
              <p className="text-xs text-[#6B6B6B]">{t('privacy.s4ProviderItems')}</p>
              <p className="text-xs text-[#6B6B6B]">{t('privacy.s4ProviderPurpose')}</p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('privacy.s5Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('privacy.s5Content')}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('privacy.s6Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('privacy.s6Content')}
            </p>
          </section>

          <p className="text-xs text-[#ACACAC] pt-4">
            {t('privacy.effectiveDate')}
          </p>
        </div>
      </main>
    </div>
  )
}
