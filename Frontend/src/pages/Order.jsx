import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { estimateOrder, createOrder } from '../api/orderApi'
import { getCredits } from '../api/creditsApi'
import { supabase } from '../lib/supabase'
import { openPostcodeSearch, formatPhone, validateShippingField, validateShippingForm } from '../utils/shipping'

const STORAGE_KEY = 'shipping_addresses'

function loadAddresses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function saveAddressToStorage(addr) {
  const list = loadAddresses()
  if (list.length === 0) addr.is_default = true
  list.push(addr)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const EMPTY_FORM = {
  recipient_name: '',
  recipient_phone: '',
  postal_code: '',
  address1: '',
  address2: '',
  memo: '',
}

export default function Order() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()

  // Estimate & credits
  const [estimate, setEstimate] = useState(null)
  const [credits, setCredits] = useState(null)
  const [loadingData, setLoadingData] = useState(true)

  // Tabs
  const [activeTab, setActiveTab] = useState('saved')
  const [savedAddresses, setSavedAddresses] = useState(loadAddresses)
  const [selectedAddressId, setSelectedAddressId] = useState(null)

  // New address form
  const [form, setForm] = useState(EMPTY_FORM)
  const [fieldErrors, setFieldErrors] = useState({})
  const [saveNewAddress, setSaveNewAddress] = useState(false)

  // Order
  const [ordering, setOrdering] = useState(false)
  const [error, setError] = useState(null)

  // Insufficient credit modal
  const [creditModal, setCreditModal] = useState(null)

  // Auto-select default address
  useEffect(() => {
    const def = savedAddresses.find((a) => a.is_default)
    if (def) setSelectedAddressId(def.id)
    else if (savedAddresses.length > 0) setSelectedAddressId(savedAddresses[0].id)
  }, [])

  // Fetch estimate + credits on mount
  useEffect(() => {
    const fetch = async () => {
      try {
        const [estRes, credRes] = await Promise.all([
          estimateOrder(state.bookUid),
          getCredits(),
        ])
        setEstimate(estRes.data?.data || estRes.data)
        setCredits(credRes.data?.data || credRes.data)
      } catch {
        setError(t('errors.loadFailed'))
      } finally {
        setLoadingData(false)
      }
    }
    fetch()
  }, [state.bookUid])

  const handleFormChange = (field, value) => {
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

  const getShippingData = () => {
    if (activeTab === 'saved') {
      const addr = savedAddresses.find((a) => a.id === selectedAddressId)
      if (!addr) return null
      return {
        recipientName: addr.recipient_name,
        recipientPhone: addr.recipient_phone,
        postalCode: addr.postal_code,
        address1: addr.address1,
        address2: addr.address2 || '',
        memo: addr.memo || '',
      }
    }
    if (!form.recipient_name || !form.recipient_phone || !form.address1) return null
    return {
      recipientName: form.recipient_name,
      recipientPhone: form.recipient_phone,
      postalCode: form.postal_code,
      address1: form.address1,
      address2: form.address2 || '',
      memo: form.memo || '',
    }
  }

  const handleOrder = async () => {
    if (activeTab === 'new') {
      const { errors, isValid } = validateShippingForm(form)
      setFieldErrors(errors)
      if (!isValid) return
    }
    const shipping = getShippingData()
    if (!shipping) {
      setError(t('errors.enterShipping'))
      return
    }
    setOrdering(true)
    setError(null)
    try {
      // Save new address if checked
      if (activeTab === 'new' && saveNewAddress) {
        const newAddr = { ...form, id: Date.now(), is_default: false }
        saveAddressToStorage(newAddr)
      }
      const accessToken = supabase
        ? (await supabase.auth.getSession())?.data?.session?.access_token
        : null
      const title = state.generatedStory?.title || state.name || ''
      const res = await createOrder(state.bookUid, shipping, accessToken, title, state.type)
      const orderUid = res.data?.data?.orderUid || res.data?.orderUid || res.data?.uid
      dispatch({ type: 'SET_ORDER_UID', payload: orderUid })
      // Save to localStorage for MyPage order history
      try {
        const uids = JSON.parse(localStorage.getItem('my_order_uids') || '[]')
        if (!uids.includes(orderUid)) {
          uids.unshift(orderUid)
          localStorage.setItem('my_order_uids', JSON.stringify(uids))
        }
      } catch { /* ignore */ }
      navigate('/complete')
    } catch (err) {
      if (err.type === 'INSUFFICIENT_CREDIT' || err.response?.status === 402) {
        const data = err.response?.data?.data || err
        setCreditModal({
          required: data.required,
          balance: data.balance,
        })
      } else {
        setError(err.response?.data?.message || err.message || t('errors.orderFailed'))
      }
    }
    setOrdering(false)
  }

  const productAmount = estimate?.productAmount ?? estimate?.itemPrice ?? estimate?.item ?? 0
  const shippingFee = estimate?.shippingFee ?? estimate?.shippingPrice ?? estimate?.shipping ?? 0
  const totalAmount = estimate?.totalAmount ?? estimate?.totalPrice ?? estimate?.total ?? productAmount + shippingFee
  const paidCreditAmount = estimate?.paidCreditAmount ?? totalAmount
  const balance = credits?.balance ?? credits?.amount ?? 0
  const insufficientBalance = balance < paidCreditAmount

  const canOrder = activeTab === 'saved' ? !!selectedAddressId : (form.recipient_name && form.recipient_phone && form.address1 && !Object.values(fieldErrors).some((e) => e))

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/preview')}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-[#1A1A1A]">{t('order.header')}</h2>
        <div className="w-5" />
      </header>

      <main className="flex-1 px-4 pb-16">
        <div className="max-w-lg mx-auto">

          {/* Price Card */}
          <div className="bg-white rounded-xl border border-[#E5E5E3] p-5 mb-4">
            <h3 className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider mb-4">{t('order.estimatedPrice')}</h3>
            {loadingData ? (
              <div className="space-y-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-4 bg-[#F0F0EE] rounded animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>{t('order.productAmount')}</span>
                  <span>{t('currency', { amount: productAmount.toLocaleString() })}</span>
                </div>
                <div className="flex justify-between text-[#6B6B6B]">
                  <span>{t('order.shippingFee')}</span>
                  <span>{t('currency', { amount: shippingFee.toLocaleString() })}</span>
                </div>
                <div className="border-t border-[#E5E5E3] pt-3 mt-3 flex justify-between text-[#1A1A1A]">
                  <span className="font-medium">{t('order.total')}</span>
                  <span className="font-semibold">{t('currency', { amount: totalAmount.toLocaleString() })}</span>
                </div>
                <div className="flex justify-between font-bold text-[#1A1A1A]">
                  <span>{t('order.paidAmount')} <span className="font-normal text-xs text-[#ACACAC]">{t('order.vatIncluded')}</span></span>
                  <span className="text-primary text-lg">{t('currency', { amount: paidCreditAmount.toLocaleString() })}</span>
                </div>
              </div>
            )}
          </div>

          {/* Credits */}
          {!loadingData && (
            <div className={`bg-white rounded-xl border p-4 mb-6 flex justify-between items-center ${
              insufficientBalance ? 'border-red-300' : 'border-[#E5E5E3]'
            }`}>
              <span className="text-xs font-semibold text-[#1A1A1A] uppercase tracking-wider">{t('order.balance')}</span>
              <div className="text-right">
                <span className={`text-sm font-bold ${insufficientBalance ? 'text-red-500' : 'text-primary'}`}>
                  {t('currency', { amount: balance.toLocaleString() })}
                </span>
                {insufficientBalance && (
                  <p className="text-[10px] text-red-500 mt-0.5">{t('order.insufficientBalance')}</p>
                )}
              </div>
            </div>
          )}

          {/* Shipping Tabs */}
          <div className="bg-white rounded-xl border border-[#E5E5E3] overflow-hidden mb-8">
            <div className="flex border-b border-[#E5E5E3]">
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 cursor-pointer ${
                  activeTab === 'saved'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                {t('shipping.savedTab')}
              </button>
              <button
                onClick={() => setActiveTab('new')}
                className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 cursor-pointer ${
                  activeTab === 'new'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
                }`}
              >
                {t('shipping.newTab')}
              </button>
            </div>

            <div className="p-4">
              {activeTab === 'saved' ? (
                savedAddresses.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-[#6B6B6B] mb-2">{t('shipping.noSaved')}</p>
                    <Link
                      to="/shipping"
                      className="text-xs text-primary hover:text-primary-dark font-medium transition-colors duration-200"
                    >
                      {t('shipping.manage')}
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors duration-200 ${
                          selectedAddressId === addr.id
                            ? 'border-primary bg-primary/5'
                            : 'border-[#E5E5E3] hover:border-[#D1D1CF]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={selectedAddressId === addr.id}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="mt-1 accent-[#2D6A4F]"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-semibold text-[#1A1A1A]">{addr.recipient_name}</span>
                            {addr.is_default && (
                              <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {t('shipping.default')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#6B6B6B]">{addr.recipient_phone}</p>
                          <p className="text-xs text-[#6B6B6B] truncate">
                            {addr.postal_code && `(${addr.postal_code}) `}{addr.address1}{addr.address2 && ` ${addr.address2}`}
                          </p>
                        </div>
                      </label>
                    ))}
                    <Link
                      to="/shipping"
                      className="block text-center text-xs text-primary hover:text-primary-dark font-medium mt-2 transition-colors duration-200"
                    >
                      {t('shipping.manage')}
                    </Link>
                  </div>
                )
              ) : (
                /* New Address Tab */
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.recipientName')}</label>
                    <input
                      type="text"
                      value={form.recipient_name}
                      onChange={(e) => handleFormChange('recipient_name', e.target.value)}
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
                      onChange={(e) => handleFormChange('recipient_phone', e.target.value)}
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
                        onChange={(e) => handleFormChange('postal_code', e.target.value)}
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
                      onChange={(e) => handleFormChange('address1', e.target.value)}
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
                      onChange={(e) => handleFormChange('address2', e.target.value)}
                      placeholder={t('shipping.detailPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.deliveryMemo')}</label>
                    <input
                      type="text"
                      value={form.memo}
                      onChange={(e) => handleFormChange('memo', e.target.value)}
                      placeholder={t('shipping.memoPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                    />
                  </div>
                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveNewAddress}
                      onChange={(e) => setSaveNewAddress(e.target.checked)}
                      className="accent-[#2D6A4F]"
                    />
                    <span className="text-xs text-[#6B6B6B]">{t('shipping.saveThis')}</span>
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Error */}
          {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

          {/* Order Button */}
          <button
            onClick={handleOrder}
            disabled={ordering || !canOrder}
            className={`w-full text-white text-base font-medium py-4 rounded-xl transition-colors duration-200 ${
              ordering || !canOrder
                ? 'bg-[#D1D1CF] cursor-not-allowed'
                : 'bg-primary hover:bg-primary-dark cursor-pointer'
            }`}
          >
            {ordering ? t('order.processing') : t('order.complete')}
          </button>
        </div>
      </main>

      {/* Insufficient Credit Modal */}
      {creditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">{t('order.creditModalTitle')}</h3>
            <div className="space-y-2 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">{t('order.requiredAmount')}</span>
                <span className="font-semibold text-[#1A1A1A]">{t('currency', { amount: (creditModal.required ?? 0).toLocaleString() })}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#6B6B6B]">{t('order.currentBalance')}</span>
                <span className="font-semibold text-red-500">{t('currency', { amount: (creditModal.balance ?? 0).toLocaleString() })}</span>
              </div>
            </div>
            <a
              href="https://partner.sweetbook.kr"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center bg-primary hover:bg-primary-dark text-white text-sm font-medium py-3 rounded-xl transition-colors duration-200 mb-3"
            >
              {t('order.chargeAtPortal')}
            </a>
            <button
              onClick={() => setCreditModal(null)}
              className="w-full text-center text-sm text-[#6B6B6B] hover:text-[#1A1A1A] font-medium py-2 cursor-pointer transition-colors duration-200"
            >
              {t('buttons.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
