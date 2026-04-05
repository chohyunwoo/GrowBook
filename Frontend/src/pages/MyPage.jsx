import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { signOut, supabase } from '../lib/supabase'
import { getOrder, cancelOrder, updateShipping, getMyOrders } from '../api/orderApi'
import { openPostcodeSearch, formatPhone, validateShippingField, validateShippingForm } from '../utils/shipping'
import ShippingManager from './ShippingManager'

const STORAGE_KEY = 'my_order_uids'

function loadOrderUids() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export default function MyPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const user = state.user

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const ORDERS_PER_PAGE = 5
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState(null)
  const [shippingModal, setShippingModal] = useState(null)
  const [shippingForm, setShippingForm] = useState({
    recipientName: '',
    recipientPhone: '',
    postalCode: '',
    address1: '',
    address2: '',
    shippingMemo: '',
  })
  const [shippingErrors, setShippingErrors] = useState({})
  const [shippingSaving, setShippingSaving] = useState(false)
  const [shippingSuccess, setShippingSuccess] = useState(false)
  const [activeTab, setActiveTab] = useState('orders')

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    fetchOrders()
  }, [user])

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const accessToken = supabase
        ? (await supabase.auth.getSession())?.data?.session?.access_token
        : null
      if (accessToken) {
        const res = await getMyOrders(accessToken)
        console.log('[MyPage] getMyOrders response:', res.data)
        const raw = res.data?.data || res.data || []
        const list = Array.isArray(raw) ? raw : (raw.items || raw.orders || [])
        const mapped = list.map((o) => ({
          ...o,
          orderUid: o.orderUid || o.order_uid || o.uid,
          status: o.status ?? o.orderStatus ?? o.order_status,
          albumTitle: o.albumTitle || o.album_title,
          albumType: o.albumType || o.album_type,
          createdAt: o.createdAt || o.ordered_at || o.orderedAt || o.created_at,
        }))
        console.log('[MyPage] orders:', mapped)
        console.log('[MyPage] first order status:', mapped[0]?.status, typeof mapped[0]?.status)
        console.log('[MyPage] first order full:', JSON.stringify(mapped[0]))
        setOrders(mapped)
        setCurrentPage(1)
      } else {
        setOrders([])
        setCurrentPage(1)
      }
    } catch {
      setOrders([])
    }
    setOrdersLoading(false)
  }

  const openCancelModal = (orderUid) => {
    setCancelReason('')
    setCancelModal(orderUid)
  }

  const handleCancel = async (orderUid) => {
    setCancelModal(null)
    setCancellingId(orderUid)
    setCancelError(null)
    try {
      const accessToken = supabase
        ? (await supabase.auth.getSession())?.data?.session?.access_token
        : null
      await cancelOrder(orderUid, cancelReason || t('complete.cancelReasonPlaceholder'), accessToken)
      await fetchOrders()
    } catch {
      setCancelError('주문 취소에 실패했어요. 다시 시도해주세요.')
    }
    setCancellingId(null)
  }

  const openShippingModal = (orderUid) => {
    setShippingForm({
      recipientName: '',
      recipientPhone: '',
      postalCode: '',
      address1: '',
      address2: '',
      shippingMemo: '',
    })
    setShippingErrors({})
    setShippingSuccess(false)
    setShippingModal(orderUid)
  }

  const handleShippingFormChange = (field, value) => {
    const newValue = field === 'recipientPhone' ? formatPhone(value) : value
    setShippingForm((prev) => ({ ...prev, [field]: newValue }))
    setShippingErrors((prev) => ({ ...prev, [field]: validateShippingField(field, newValue) }))
  }

  const handleShippingPostcodeSearch = () => {
    openPostcodeSearch(({ postalCode, address1 }) => {
      setShippingForm((prev) => ({ ...prev, postalCode, address1 }))
      setShippingErrors((prev) => ({ ...prev, postalCode: '', address1: '' }))
    })
  }

  const handleShippingUpdate = async () => {
    const fieldMap = { name: 'recipientName', phone: 'recipientPhone', postal: 'postalCode', address: 'address1' }
    const { errors, isValid } = validateShippingForm(shippingForm, fieldMap)
    setShippingErrors(errors)
    if (!isValid) return
    setShippingSaving(true)
    try {
      await updateShipping(shippingModal, shippingForm)
      setShippingSuccess(true)
      await fetchOrders()
      setTimeout(() => {
        setShippingModal(null)
        setShippingSuccess(false)
      }, 1500)
    } catch {
      /* ignore */
    }
    setShippingSaving(false)
  }

  const handleLogout = async () => {
    await signOut()
    dispatch({ type: 'SET_USER', payload: null })
    navigate('/')
  }

  if (!user) return null

  const userName = user.user_metadata?.full_name || user.email || ''
  const userEmail = user.email || ''
  const avatarUrl = user.user_metadata?.avatar_url

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold text-primary">
          {t('brand')}
        </Link>
        <h2 className="text-base font-semibold text-[#1A1A1A]">{t('myPage.header')}</h2>
        <div className="w-16" />
      </header>

      <main className="flex-1 px-4 pb-16">
        <div className="max-w-lg mx-auto">

          {/* Profile */}
          <div className="bg-white rounded-xl border border-[#E5E5E3] p-5 mb-6">
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img src={avatarUrl} alt="" className="w-14 h-14 rounded-full border border-[#E5E5E3]" />
              ) : (
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xl font-bold text-primary">{userName[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-[#1A1A1A] truncate">{userName}</p>
                <p className="text-sm text-[#6B6B6B] truncate">{userEmail}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-4 w-full border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] text-sm font-medium py-2.5 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              {t('nav.logout')}
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#E5E5E3] mb-6">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 cursor-pointer ${
                activeTab === 'orders'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              {t('myPage.ordersTab')}
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 cursor-pointer ${
                activeTab === 'shipping'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              {t('myPage.shippingTab')}
            </button>
          </div>

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <>
              {cancelError && (
                <p className="text-sm text-red-500 mb-4">{cancelError}</p>
              )}
              {ordersLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-[#6B6B6B] mb-2">{t('myPage.noOrders')}</p>
                  <Link
                    to="/type-select"
                    className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200"
                  >
                    {t('myPage.makeAlbum')}
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE).map((order, index) => {
                    const status = Number(order.status ?? order.orderStatus)
                    const statusText = t(`orderStatus.${status}`, t('checking'))
                    const canCancel = status === 20 || status === 25
                    const isCancelling = cancellingId === order.orderUid
                    return (
                      <div
                        key={order.orderUid || order.uid || index}
                        className="bg-white rounded-xl border border-[#E5E5E3] p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                              {order.album_title || order.albumTitle || order.title || order.bookTitle || t('myPage.album')}
                            </p>
                            {(order.album_type || order.albumType) && (
                              <p className="text-xs text-[#6B6B6B] mt-0.5">
                                {{ child: '아이 성장 포토북', pet: '반려동물 포토북', travel: '여행 포토북', memory: '추억 포토북' }[order.album_type || order.albumType] || '포토북'}
                              </p>
                            )}
                            <p className="text-[10px] text-[#ACACAC] font-mono mt-0.5">{order.orderUid}</p>
                          </div>
                          <span className={`flex-shrink-0 ml-3 inline-block px-2.5 py-1 text-[10px] font-semibold rounded-full ${
                            status >= 80
                              ? 'bg-red-50 text-red-500'
                              : status >= 60
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-primary/10 text-primary'
                          }`}>
                            {statusText}
                          </span>
                        </div>
                        {order.createdAt && (
                          <p className="text-xs text-[#ACACAC] mb-2">
                            {new Date(order.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        )}
                        {(status === 20 || status === 25 || status === 30) && (
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => openShippingModal(order.orderUid)}
                              className="text-xs font-medium text-primary hover:text-primary-dark transition-colors duration-200 cursor-pointer"
                            >
                              {t('myPage.changeShipping', '배송지 변경')}
                            </button>
                            {canCancel && (
                              <button
                                onClick={() => openCancelModal(order.orderUid)}
                                disabled={isCancelling}
                                className={`text-xs font-medium transition-colors duration-200 ${
                                  isCancelling
                                    ? 'text-[#ACACAC] cursor-not-allowed'
                                    : 'text-red-500 hover:text-red-600 cursor-pointer'
                                }`}
                              >
                                {isCancelling ? t('myPage.cancelling') : t('myPage.cancelOrder')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {/* Pagination */}
                {orders.length > ORDERS_PER_PAGE && (() => {
                  const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE)
                  return (
                    <div className="flex items-center justify-center gap-1 mt-6">
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                          currentPage === 1
                            ? 'text-[#D1D1CF] cursor-not-allowed'
                            : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'
                        }`}
                      >
                        &lt;
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                            page === currentPage
                              ? 'bg-primary text-white'
                              : 'bg-white text-[#6B6B6B] border border-[#E5E5E3] hover:bg-[#F7F7F5]'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                          currentPage === totalPages
                            ? 'text-[#D1D1CF] cursor-not-allowed'
                            : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'
                        }`}
                      >
                        &gt;
                      </button>
                    </div>
                  )
                })()}
              )}
            </>
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && <ShippingManager embedded />}
        </div>
      </main>
      {/* Shipping Change Modal */}
      {shippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">{t('myPage.changeShipping', '배송지 변경')}</h3>
            {shippingSuccess ? (
              <div className="text-center py-6">
                <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center mx-auto mb-3">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-[#1A1A1A]">{t('myPage.shippingUpdated', '배송지가 변경되었어요')}</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.recipientName')}</label>
                    <input
                      type="text"
                      value={shippingForm.recipientName}
                      onChange={(e) => handleShippingFormChange('recipientName', e.target.value)}
                      maxLength={100}
                      placeholder={t('shipping.namePlaceholder')}
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none transition-colors duration-200 ${shippingErrors.recipientName ? 'border-red-400 focus:border-red-400' : 'border-[#E5E5E3] focus:border-primary'}`}
                    />
                    {shippingErrors.recipientName && <p className="text-xs text-red-500 mt-1">{shippingErrors.recipientName}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.phone')}</label>
                    <input
                      type="tel"
                      value={shippingForm.recipientPhone}
                      onChange={(e) => handleShippingFormChange('recipientPhone', e.target.value)}
                      placeholder="010-0000-0000"
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none transition-colors duration-200 ${shippingErrors.recipientPhone ? 'border-red-400 focus:border-red-400' : 'border-[#E5E5E3] focus:border-primary'}`}
                    />
                    {shippingErrors.recipientPhone && <p className="text-xs text-red-500 mt-1">{shippingErrors.recipientPhone}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.postalCode')}</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={shippingForm.postalCode}
                        readOnly
                        placeholder={t('shipping.postalPlaceholder')}
                        className={`flex-1 px-3 py-2.5 rounded-lg border text-sm text-[#1A1A1A] placeholder-[#ACACAC] bg-[#F7F7F5] focus:outline-none transition-colors duration-200 ${shippingErrors.postalCode ? 'border-red-400' : 'border-[#E5E5E3]'}`}
                      />
                      <button
                        type="button"
                        onClick={handleShippingPostcodeSearch}
                        className="px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-lg transition-colors duration-200 cursor-pointer whitespace-nowrap"
                      >
                        {t('shipping.searchAddress', '주소 검색')}
                      </button>
                    </div>
                    {shippingErrors.postalCode && <p className="text-xs text-red-500 mt-1">{shippingErrors.postalCode}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.address')}</label>
                    <input
                      type="text"
                      value={shippingForm.address1}
                      readOnly
                      maxLength={200}
                      placeholder={t('shipping.addressPlaceholder')}
                      className={`w-full px-3 py-2.5 rounded-lg border text-sm text-[#1A1A1A] placeholder-[#ACACAC] bg-[#F7F7F5] focus:outline-none transition-colors duration-200 ${shippingErrors.address1 ? 'border-red-400' : 'border-[#E5E5E3]'}`}
                    />
                    {shippingErrors.address1 && <p className="text-xs text-red-500 mt-1">{shippingErrors.address1}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.detailAddress')}</label>
                    <input
                      type="text"
                      value={shippingForm.address2}
                      onChange={(e) => setShippingForm((prev) => ({ ...prev, address2: e.target.value }))}
                      placeholder={t('shipping.detailPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('shipping.deliveryMemo')}</label>
                    <input
                      type="text"
                      value={shippingForm.shippingMemo}
                      onChange={(e) => setShippingForm((prev) => ({ ...prev, shippingMemo: e.target.value }))}
                      placeholder={t('shipping.memoPlaceholder')}
                      className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                    />
                  </div>
                </div>
                <button
                  onClick={handleShippingUpdate}
                  disabled={shippingSaving || !shippingForm.recipientName || !shippingForm.recipientPhone || !shippingForm.address1 || Object.values(shippingErrors).some((e) => e)}
                  className={`w-full text-white text-sm font-medium py-3 rounded-xl transition-colors duration-200 mb-3 ${
                    shippingSaving || !shippingForm.recipientName || !shippingForm.recipientPhone || !shippingForm.address1 || Object.values(shippingErrors).some((e) => e)
                      ? 'bg-[#D1D1CF] cursor-not-allowed'
                      : 'bg-primary hover:bg-primary-dark cursor-pointer'
                  }`}
                >
                  {shippingSaving ? t('order.processing', '처리 중...') : t('buttons.confirm', '확인')}
                </button>
                <button
                  onClick={() => setShippingModal(null)}
                  className="w-full text-center text-sm text-[#6B6B6B] hover:text-[#1A1A1A] font-medium py-2 cursor-pointer transition-colors duration-200"
                >
                  {t('buttons.close')}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Cancel Reason Modal */}
      {cancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">{t('myPage.cancelOrder')}</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder={t('complete.cancelReasonPlaceholder')}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200 resize-none mb-4"
            />
            <button
              onClick={() => handleCancel(cancelModal)}
              className="w-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-3 rounded-xl transition-colors duration-200 cursor-pointer mb-3"
            >
              {t('myPage.cancelOrder')}
            </button>
            <button
              onClick={() => setCancelModal(null)}
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
