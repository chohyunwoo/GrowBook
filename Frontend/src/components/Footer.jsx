import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

export default function Footer() {
  const { t } = useTranslation('common')

  return (
    <footer className="border-t border-[#E5E5E3] bg-white px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-primary">{t('brand')}</p>
          <LanguageSwitcher />
        </div>
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/terms"
            className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200"
          >
            {t('footer.terms')}
          </Link>
          <span className="text-[#E5E5E3]">|</span>
          <Link
            to="/privacy"
            className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200"
          >
            {t('footer.privacy')}
          </Link>
        </div>
        <p className="text-xs text-[#ACACAC]">{t('footer.support')}</p>
      </div>
    </footer>
  )
}
