import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import koCommon from '../locales/ko/common.json'
import enCommon from '../locales/en/common.json'

i18n.use(initReactI18next).init({
  resources: {
    ko: { common: koCommon },
    en: { common: enCommon },
  },
  lng: localStorage.getItem('growbook-lang') || 'ko',
  fallbackLng: 'ko',
  ns: ['common'],
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
