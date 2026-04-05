import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { signOut } from '../lib/supabase'
import { getOrder, cancelOrder } from '../api/orderApi'
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
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelModal, setCancelModal] = useState(null)
  const [cancelReason, setCancelReason] = useState('')
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
    const uids = loadOrderUids()
    const results = []
    for (const uid of uids) {
      try {
        const res = await getOrder(uid)
        const data = res.data?.data || res.data
        results.push({ orderUid: uid, ...data })
      } catch {
        results.push({ orderUid: uid, status: null, title: null })
      }
    }
    setOrders(results)
    setOrdersLoading(false)
  }

  const openCancelModal = (orderUid) => {
    setCancelReason('')
    setCancelModal(orderUid)
  }

  const handleCancel = async (orderUid) => {
    setCancelModal(null)
    setCancellingId(orderUid)
    try {
      await cancelOrder(orderUid, cancelReason || t('complete.cancelReasonPlaceholder'))
      await fetchOrders()
    } catch {
      /* ignore */
    }
    setCancellingId(null)
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
                  {orders.map((order) => {
                    const status = order.status ?? order.orderStatus
                    const statusText = t(`orderStatus.${status}`, t('checking'))
                    const canCancel = status === 20 || status === 25
                    const isCancelling = cancellingId === order.orderUid
                    return (
                      <div
                        key={order.orderUid}
                        className="bg-white rounded-xl border border-[#E5E5E3] p-4"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[#1A1A1A] truncate">
                              {order.title || order.bookTitle || t('myPage.album')}
                            </p>
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
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Shipping Tab */}
          {activeTab === 'shipping' && <ShippingManager embedded />}
        </div>
      </main>
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
