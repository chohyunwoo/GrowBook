import { useTranslation } from 'react-i18next'

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const current = i18n.language

  const toggle = () => {
    const next = current === 'ko' ? 'en' : 'ko'
    i18n.changeLanguage(next)
    localStorage.setItem('growbook-lang', next)
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1 text-xs font-medium text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#E5E5E3] rounded-lg px-2 py-1 cursor-pointer transition-colors duration-200"
    >
      <span className={current === 'ko' ? 'text-primary font-bold' : ''}>KO</span>
      <span className="text-[#D1D1CF]">|</span>
      <span className={current === 'en' ? 'text-primary font-bold' : ''}>EN</span>
    </button>
  )
}
