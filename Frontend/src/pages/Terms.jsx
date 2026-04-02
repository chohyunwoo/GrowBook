import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export default function Terms() {
  const navigate = useNavigate()
  const { t } = useTranslation()

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
        <h2 className="text-base font-semibold text-[#1A1A1A]">{t('terms.pageTitle')}</h2>
        <div className="w-5" />
      </header>

      <main className="flex-1 px-6 pb-16">
        <div className="max-w-lg mx-auto space-y-8">

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('terms.s1Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('terms.s1Content')}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('terms.s2Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('terms.s2Content')}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('terms.s3Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('terms.s3Content')}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('terms.s4Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('terms.s4Content')}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('terms.s5Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('terms.s5Content')}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('terms.s6Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('terms.s6Content')}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">{t('terms.s7Title')}</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {t('terms.s7Content')}
            </p>
          </section>

          <p className="text-xs text-[#ACACAC] pt-4">
            {t('terms.effectiveDate')}
          </p>
        </div>
      </main>
    </div>
  )
}
