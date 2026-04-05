import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { openPostcodeSearch, formatPhone, validateShippingField, validateShippingForm } from '../utils/shipping'

const STORAGE_KEY = 'shipping_addresses'

function loadAddresses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function saveAddresses(addresses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses))
}

const EMPTY_FORM = {
  recipient_name: '',
  recipient_phone: '',
  postal_code: '',
  address1: '',
  address2: '',
  memo: '',
}

export default function ShippingManager({ embedded = false }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState(loadAddresses)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    saveAddresses(addresses)
  }, [addresses])

  const handleChange = (field, value) => {
    const newValue = field === 'recipient_phone' ? formatPhone(value) : value
    setForm((prev) => ({ ...prev, [field]: newValue }))
    setFieldErrors((prev) => ({ ...prev, [field]: validateShippingField(field, newValue) }))
  }

  const handlePostcodeSearch = () => {
    openPostcodeSearch(({ postalCode, address1 }) => {
      setForm((prev) => ({ ...prev, postal_code: postalCode, address1 }))
      setFieldErrors((prev) => ({ ...prev, postal_code: '', address1: '' }))
    })
  }

  const handleSave = () => {
    const { errors, isValid } = validateShippingForm(form)
    setFieldErrors(errors)
    if (!isValid) return
    const newAddress = {
      ...form,
      id: Date.now(),
      is_default: addresses.length === 0,
    }
    setAddresses((prev) => [...prev, newAddress])
    setForm(EMPTY_FORM)
    setFieldErrors({})
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id)
      if (filtered.length > 0 && !filtered.some((a) => a.is_default)) {
        filtered[0].is_default = true
      }
      return filtered
    })
  }

  const handleSetDefault = (id) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === id }))
    )
  }

  const content = (
    <>
          {/* Address List */}
          {addresses.length === 0 && !showForm && (
            <div className="text-center py-16">
              <p className="text-sm text-[#6B6B6B] mb-2">{t('shipping.noSaved')}</p>
              <p className="text-xs text-[#ACACAC]">{t('shipping.addPlease')}</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white rounded-xl border border-[#E5E5E3] p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#1A1A1A]">{addr.recipient_name}</p>
                    {addr.is_default && (
                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        {t('shipping.defaultAddress')}
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[#6B6B6B] mb-0.5">{addr.recipient_phone}</p>
                <p className="text-sm text-[#6B6B6B]">
                  {addr.postal_code && `(${addr.postal_code}) `}{addr.address1}{addr.address2 && ` ${addr.address2}`}
                </p>
                {addr.memo && <p className="text-xs text-[#ACACAC] mt-1">{addr.memo}</p>}

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F0F0EE]">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs text-primary hover:text-primary-dark font-medium cursor-pointer transition-colors duration-200"
                    >
                      {t('shipping.setDefault')}
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors duration-200"
                  >
                    {t('buttons.delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Form */}
          {showForm ? (
            <div className="bg-white rounded-xl border border-[#E5E5E3] p-5">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">{t('shipping.addNewTitle')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.recipientName')}</label>
                  <input
                    type="text"
                    value={form.recipient_name}
                    onChange={(e) => handleChange('recipient_name', e.target.value)}
                    maxLength={100}
                    placeholder={t('shipping.namePlaceholder')}
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none transition-colors duration-200 ${fieldErrors.recipient_name ? 'border-red-400 focus:border-red-400' : 'border-[#E5E5E3] focus:border-primary'}`}
                  />
                  {fieldErrors.recipient_name && <p className="text-xs text-red-500 mt-1">{fieldErrors.recipient_name}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.phone')}</label>
                  <input
                    type="tel"
                    value={form.recipient_phone}
                    onChange={(e) => handleChange('recipient_phone', e.target.value)}
                    placeholder="010-0000-0000"
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none transition-colors duration-200 ${fieldErrors.recipient_phone ? 'border-red-400 focus:border-red-400' : 'border-[#E5E5E3] focus:border-primary'}`}
                  />
                  {fieldErrors.recipient_phone && <p className="text-xs text-red-500 mt-1">{fieldErrors.recipient_phone}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.postalCode')}</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={form.postal_code}
                      onChange={(e) => handleChange('postal_code', e.target.value)}
                      placeholder={t('shipping.postalPlaceholder')}
                      readOnly
                      className={`flex-1 px-3 py-2.5 rounded-lg border text-sm text-[#1A1A1A] placeholder-[#ACACAC] bg-[#F7F7F5] focus:outline-none transition-colors duration-200 ${fieldErrors.postal_code ? 'border-red-400' : 'border-[#E5E5E3]'}`}
                    />
                    <button
                      type="button"
                      onClick={handlePostcodeSearch}
                      className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap"
                    >
                      {t('shipping.searchAddress', '주소 검색')}
                    </button>
                  </div>
                  {fieldErrors.postal_code && <p className="text-xs text-red-500 mt-1">{fieldErrors.postal_code}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.address')}</label>
                  <input
                    type="text"
                    value={form.address1}
                    onChange={(e) => handleChange('address1', e.target.value)}
                    maxLength={200}
                    placeholder={t('shipping.addressPlaceholder')}
                    readOnly
                    className={`w-full px-3 py-2.5 rounded-lg border text-sm text-[#1A1A1A] placeholder-[#ACACAC] bg-[#F7F7F5] focus:outline-none transition-colors duration-200 ${fieldErrors.address1 ? 'border-red-400' : 'border-[#E5E5E3]'}`}
                  />
                  {fieldErrors.address1 && <p className="text-xs text-red-500 mt-1">{fieldErrors.address1}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.detailAddress')}</label>
                  <input
                    type="text"
                    value={form.address2}
                    onChange={(e) => handleChange('address2', e.target.value)}
                    placeholder={t('shipping.detailPlaceholder')}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.deliveryMemo')}</label>
                  <input
                    type="text"
                    value={form.memo}
                    onChange={(e) => handleChange('memo', e.target.value)}
                    placeholder={t('shipping.memoPlaceholder')}
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setForm(EMPTY_FORM); setFieldErrors({}); setShowForm(false) }}
                  className="flex-1 border border-[#E5E5E3] text-[#6B6B6B] text-sm font-medium py-3 rounded-xl hover:bg-[#F7F7F5] transition-colors duration-200 cursor-pointer"
                >
                  {t('buttons.cancel')}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.recipient_name || !form.recipient_phone || !form.address1 || Object.values(fieldErrors).some((e) => e)}
                  className={`flex-1 text-white text-sm font-medium py-3 rounded-xl transition-colors duration-200 ${
                    form.recipient_name && form.recipient_phone && form.address1 && !Object.values(fieldErrors).some((e) => e)
                      ? 'bg-primary hover:bg-primary-dark cursor-pointer'
                      : 'bg-[#D1D1CF] cursor-not-allowed'
                  }`}
                >
                  {t('buttons.save')}
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-[#E5E5E3] hover:border-primary text-[#6B6B6B] hover:text-primary text-sm font-medium py-4 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              {t('shipping.addNew')}
            </button>
          )}
    </>
  )

  if (embedded) return content

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
        <h2 className="text-base font-semibold text-[#1A1A1A]">{t('shipping.title')}</h2>
        <div className="w-5" />
      </header>
      <main className="flex-1 px-4 pb-16">
        <div className="max-w-lg mx-auto">
          {content}
        </div>
      </main>
    </div>
  )
}
