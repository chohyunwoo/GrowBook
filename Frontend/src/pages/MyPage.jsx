import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { signOut } from '../lib/supabase'
import { getOrder, cancelOrder } from '../api/orderApi'
import ShippingManager from './ShippingManager'

const ORDER_STATUS = {
  20: '결제 완료',
  25: '제작 준비 완료',
  30: '제작 확정',
  40: '제작 진행 중',
  50: '제작 완료',
  60: '배송 중',
  70: '배송 완료',
  80: '주문 취소',
  81: '취소 및 환불 완료',
}

const STORAGE_KEY = 'my_order_uids'

function loadOrderUids() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export default function MyPage() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const user = state.user

  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [cancellingId, setCancellingId] = useState(null)
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
        results.push({ orderUid: uid, status: null, title: '조회 실패' })
      }
    }
    setOrders(results)
    setOrdersLoading(false)
  }

  const handleCancel = async (orderUid) => {
    setCancellingId(orderUid)
    try {
      await cancelOrder(orderUid, '고객 요청으로 인한 취소')
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
          GrowBook
        </Link>
        <h2 className="text-base font-semibold text-[#1A1A1A]">마이페이지</h2>
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
              로그아웃
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
              내 주문
            </button>
            <button
              onClick={() => setActiveTab('shipping')}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 cursor-pointer ${
                activeTab === 'shipping'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              배송지 관리
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
                  <p className="text-sm text-[#6B6B6B] mb-2">아직 주문 내역이 없어요.</p>
                  <Link
                    to="/type-select"
                    className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200"
                  >
                    앨범 만들기
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const status = order.status ?? order.orderStatus
                    const statusText = ORDER_STATUS[status] || '확인 중'
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
                              {order.title || order.bookTitle || '앨범'}
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
                            onClick={() => handleCancel(order.orderUid)}
                            disabled={isCancelling}
                            className={`text-xs font-medium transition-colors duration-200 ${
                              isCancelling
                                ? 'text-[#ACACAC] cursor-not-allowed'
                                : 'text-red-500 hover:text-red-600 cursor-pointer'
                            }`}
                          >
                            {isCancelling ? '취소 중...' : '주문 취소'}
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
    </div>
  )
}
