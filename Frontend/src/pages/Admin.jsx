import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { getAdminStats, getAdminDashboard, getAdminOrders, getAdminOrderDetail, getAdminUsers } from '../api/adminApi'

const STATUS_OPTIONS = [
  { value: '', label: '전체' },
  { value: '20', label: '결제완료' },
  { value: '25', label: 'PDF 제작 완료' },
  { value: '30', label: '주문 확정' },
  { value: '40', label: '제작 중' },
  { value: '50', label: '제작 완료' },
  { value: '60', label: '배송 중' },
  { value: '70', label: '배송 완료' },
  { value: '80', label: '주문 취소' },
  { value: '81', label: '취소 및 환불' },
  { value: '90', label: '오류' },
]

function StatusBadge({ status, displayText }) {
  const map = {
    20: { text: '결제완료', cls: 'bg-blue-50 text-blue-500' },
    25: { text: 'PDF 제작 완료', cls: 'bg-yellow-50 text-yellow-500' },
    30: { text: '주문 확정', cls: 'bg-blue-50 text-blue-500' },
    40: { text: '제작 중', cls: 'bg-yellow-50 text-yellow-500' },
    50: { text: '제작 완료', cls: 'bg-yellow-50 text-yellow-500' },
    60: { text: '배송 중', cls: 'bg-green-50 text-green-500' },
    70: { text: '배송 완료', cls: 'bg-green-50 text-green-500' },
    80: { text: '주문 취소', cls: 'bg-red-50 text-red-500' },
    81: { text: '취소 및 환불', cls: 'bg-red-50 text-red-500' },
    90: { text: '오류', cls: 'bg-red-100 text-red-700' },
  }
  const info = map[status] || { text: status ?? '-', cls: 'bg-[#F0F0EE] text-[#6B6B6B]' }
  const label = displayText || info.text
  return (
    <span className={`inline-block px-2.5 py-1 text-[10px] font-semibold rounded-full ${info.cls}`}>
      {label}
    </span>
  )
}

function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

export default function Admin() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { state } = useApp()
  const user = state.user

  const [authorized, setAuthorized] = useState(false)
  const [checking, setChecking] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  // Dashboard
  const [dashboard, setDashboard] = useState(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [todayOrders, setTodayOrders] = useState(0)

  // Orders
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersPage, setOrdersPage] = useState(1)
  const ORDERS_PER_PAGE = 10
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [orderDetail, setOrderDetail] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // Users
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)

  // Check admin — call backend /api/admin/stats to verify admin role
  useEffect(() => {
    const checkAdmin = async () => {
      if (!supabase) {
        navigate('/', { replace: true })
        return
      }
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          navigate('/login', { replace: true })
          return
        }
        await getAdminStats(session.access_token)
        setAuthorized(true)
      } catch (err) {
        if (err.response?.status === 403 || err.response?.status === 401) {
          navigate('/', { replace: true })
        } else {
          navigate('/', { replace: true })
        }
      } finally {
        setChecking(false)
      }
    }
    checkAdmin()
  }, [navigate])

  const getAccessToken = async () => {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token || null
  }

  // Fetch dashboard
  useEffect(() => {
    if (!authorized || activeTab !== 'dashboard') return
    const fetch = async () => {
      setDashboardLoading(true)
      try {
        const token = await getAccessToken()
        const [dashRes, todayRes] = await Promise.all([
          getAdminDashboard(token),
          getAdminOrders(token, { from: new Date().toISOString().slice(0, 10), to: new Date().toISOString().slice(0, 10) }),
        ])
        setDashboard(dashRes.data?.data || dashRes.data)
        const todayRaw = todayRes.data?.data || todayRes.data || []
        const todayList = Array.isArray(todayRaw) ? todayRaw : (todayRaw.items || todayRaw.orders || [])
        setTodayOrders(todayList.length)
      } catch { /* ignore */ }
      setDashboardLoading(false)
    }
    fetch()
  }, [authorized, activeTab])

  // Fetch orders
  useEffect(() => {
    if (!authorized || activeTab !== 'orders') return
    const fetch = async () => {
      setOrdersLoading(true)
      try {
        const token = await getAccessToken()
        const params = {}
        if (statusFilter) params.status = statusFilter
        if (dateFrom) params.from = dateFrom
        if (dateTo) params.to = dateTo
        const res = await getAdminOrders(token, params)
        const raw = res.data?.data || res.data || []
        const list = Array.isArray(raw) ? raw : (raw.items || raw.orders || [])
        setOrders(list)
        setOrdersPage(1)
      } catch { /* ignore */ }
      setOrdersLoading(false)
    }
    fetch()
  }, [authorized, activeTab, statusFilter, dateFrom, dateTo])

  // Fetch users
  useEffect(() => {
    if (!authorized || activeTab !== 'users') return
    const fetch = async () => {
      setUsersLoading(true)
      try {
        const token = await getAccessToken()
        const res = await getAdminUsers(token)
        const raw = res.data?.data || res.data || []
        const list = Array.isArray(raw) ? raw : (raw.items || raw.users || [])
        setUsers(list)
      } catch { /* ignore */ }
      setUsersLoading(false)
    }
    fetch()
  }, [authorized, activeTab])

  const handleOrderClick = async (orderUid) => {
    setDetailLoading(true)
    setOrderDetail(null)
    try {
      const token = await getAccessToken()
      const res = await getAdminOrderDetail(token, orderUid)
      setOrderDetail(res.data?.data || res.data)
    } catch { /* ignore */ }
    setDetailLoading(false)
  }

  if (checking || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const TABS = [
    { key: 'dashboard', label: '대시보드' },
    { key: 'orders', label: '주문 관리' },
    { key: 'users', label: '사용자 관리' },
  ]

  const balance = dashboard?.credits?.balance ?? dashboard?.balance ?? 0
  const totalOrders = dashboard?.stats?.totalCount ?? dashboard?.totalOrders ?? 0
  const byStatus = dashboard?.stats?.byStatus || dashboard?.statusCounts || {}

  const STAT_CARDS = [
    { label: '결제완료', value: byStatus[20] ?? 0, cls: 'text-blue-500' },
    { label: 'PDF 제작 완료', value: byStatus[25] ?? 0, cls: 'text-yellow-500' },
    { label: '주문 확정', value: byStatus[30] ?? 0, cls: 'text-blue-500' },
    { label: '제작 중', value: byStatus[40] ?? 0, cls: 'text-yellow-500' },
    { label: '제작 완료', value: byStatus[50] ?? 0, cls: 'text-yellow-500' },
    { label: '배송 중', value: byStatus[60] ?? 0, cls: 'text-green-500' },
    { label: '배송 완료', value: byStatus[70] ?? 0, cls: 'text-green-500' },
    { label: '주문 취소', value: byStatus[80] ?? 0, cls: 'text-red-500' },
    { label: '취소 및 환불', value: byStatus[81] ?? 0, cls: 'text-red-500' },
    { label: '오류', value: byStatus[90] ?? 0, cls: 'text-red-700' },
  ]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#E5E5E3]">
        <Link to="/" className="text-2xl font-bold text-primary">
          {t('brand')}
        </Link>
        <h2 className="text-base font-semibold text-[#1A1A1A]">관리자</h2>
        <div className="w-16" />
      </header>

      {/* Tabs */}
      <div className="flex border-b border-[#E5E5E3] px-4">
        <div className="max-w-4xl mx-auto w-full flex">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-5 text-sm font-medium text-center transition-colors duration-200 cursor-pointer ${
                activeTab === tab.key
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 px-4 py-6 pb-16">
        <div className="max-w-4xl mx-auto">

          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            dashboardLoading ? <Spinner /> : (
              <div className="space-y-6">
                {/* Balance Card */}
                <div className={`rounded-xl border p-6 ${balance <= 100000 ? 'bg-red-50 border-red-200' : 'bg-white border-[#E5E5E3]'}`}>
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">GrowBook 충전금 잔액</p>
                  <p className={`text-3xl font-bold ${balance <= 100000 ? 'text-red-600' : 'text-primary'}`}>{balance.toLocaleString('ko-KR')}원</p>
                  {balance <= 100000 && (
                    <p className="text-sm text-red-600 font-medium mt-2">⚠️ 충전금이 부족해요! 충전이 필요합니다</p>
                  )}
                </div>

                {/* Order Count Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl border border-[#E5E5E3] p-6">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">전체 주문 수</p>
                    <p className="text-3xl font-bold text-[#1A1A1A]">{totalOrders.toLocaleString()}건</p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#E5E5E3] p-6">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">오늘 주문</p>
                    <p className="text-3xl font-bold text-primary">{todayOrders}건</p>
                  </div>
                </div>

                {/* Status Cards */}
                <div>
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3">상태별 주문 현황</p>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {STAT_CARDS.map((card) => (
                      <div key={card.label} className="bg-white rounded-xl border border-[#E5E5E3] p-4 text-center">
                        <p className="text-xs text-[#6B6B6B] mb-1">{card.label}</p>
                        <p className={`text-2xl font-bold ${card.cls}`}>{card.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="bg-white rounded-xl border border-[#E5E5E3] p-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">상태</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] focus:outline-none focus:border-primary transition-colors duration-200 bg-white"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">시작일</label>
                    <input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] focus:outline-none focus:border-primary transition-colors duration-200"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#6B6B6B] mb-1">종료일</label>
                    <input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] focus:outline-none focus:border-primary transition-colors duration-200"
                    />
                  </div>
                </div>
              </div>

              {/* Orders Table */}
              {ordersLoading ? <Spinner /> : (
                <div className="bg-white rounded-xl border border-[#E5E5E3] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E5E3] bg-[#F7F7F5]">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">주문번호</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">제목</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">상태</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">금액</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">주문일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-12 text-[#ACACAC] text-sm">주문이 없습니다</td>
                          </tr>
                        ) : orders.slice((ordersPage - 1) * ORDERS_PER_PAGE, ordersPage * ORDERS_PER_PAGE).map((order) => {
                          const uid = order.orderUid || order.uid
                          return (
                            <tr
                              key={uid}
                              onClick={() => handleOrderClick(uid)}
                              className="border-b border-[#F0F0EE] hover:bg-[#F7F7F5] cursor-pointer transition-colors duration-200"
                            >
                              <td className="px-4 py-3 font-mono text-xs text-[#6B6B6B]">{uid}</td>
                              <td className="px-4 py-3 text-[#1A1A1A] truncate max-w-[200px]">{order.title || order.bookTitle || '-'}</td>
                              <td className="px-4 py-3"><StatusBadge status={order.status ?? order.orderStatus} displayText={order.orderStatusDisplay} /></td>
                              <td className="px-4 py-3 text-[#1A1A1A]">{(order.totalAmount ?? order.amount ?? 0).toLocaleString()}원</td>
                              <td className="px-4 py-3 text-[#6B6B6B]">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ko-KR') : '-'}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Pagination */}
              {orders.length > ORDERS_PER_PAGE && (() => {
                const totalPages = Math.ceil(orders.length / ORDERS_PER_PAGE)
                return (
                  <div className="flex items-center justify-center gap-1 mt-4">
                    <button
                      onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                      disabled={ordersPage === 1}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                        ordersPage === 1
                          ? 'text-[#D1D1CF] cursor-not-allowed'
                          : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'
                      }`}
                    >
                      &lt;
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setOrdersPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                          page === ordersPage
                            ? 'bg-primary text-white'
                            : 'bg-white text-[#6B6B6B] border border-[#E5E5E3] hover:bg-[#F7F7F5]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setOrdersPage((p) => Math.min(totalPages, p + 1))}
                      disabled={ordersPage === totalPages}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                        ordersPage === totalPages
                          ? 'text-[#D1D1CF] cursor-not-allowed'
                          : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'
                      }`}
                    >
                      &gt;
                    </button>
                  </div>
                )
              })()}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            usersLoading ? <Spinner /> : (
              <div className="bg-white rounded-xl border border-[#E5E5E3] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#E5E5E3] bg-[#F7F7F5]">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">이름</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">이메일</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">주문 수</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">가입일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center py-12 text-[#ACACAC] text-sm">사용자가 없습니다</td>
                        </tr>
                      ) : users.map((u) => (
                        <tr key={u.id || u.email} className="border-b border-[#F0F0EE]">
                          <td className="px-4 py-3 text-[#1A1A1A] font-medium">{u.name || u.full_name || '-'}</td>
                          <td className="px-4 py-3 text-[#6B6B6B]">{u.email || '-'}</td>
                          <td className="px-4 py-3 text-[#1A1A1A] font-semibold">
                            {u.activeCount ?? u.orderCount ?? u.order_count ?? 0}건
                            {(u.cancelCount ?? u.cancel_count ?? 0) > 0 && (
                              <span className="text-xs text-red-500 font-normal ml-1">(취소 {u.cancelCount ?? u.cancel_count}건)</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-[#6B6B6B]">
                            {u.createdAt || u.created_at
                              ? new Date(u.createdAt || u.created_at).toLocaleDateString('ko-KR')
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}
        </div>
      </main>

      {/* Order Detail Modal */}
      {(orderDetail || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            {detailLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orderDetail && (
              <>
                <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">주문 상세</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">주문번호</span>
                    <span className="font-mono text-xs text-[#1A1A1A]">{orderDetail.orderUid || orderDetail.uid}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">상태</span>
                    <StatusBadge status={orderDetail.status ?? orderDetail.orderStatus} displayText={orderDetail.orderStatusDisplay} />
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">포토북 제목</span>
                    <span className="text-[#1A1A1A] font-medium">{orderDetail.title || orderDetail.bookTitle || '-'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B6B6B]">금액</span>
                    <span className="text-[#1A1A1A] font-semibold">{(orderDetail.totalAmount ?? orderDetail.amount ?? 0).toLocaleString()}원</span>
                  </div>

                  {/* Shipping */}
                  {(orderDetail.shipping || orderDetail.recipientName) && (
                    <div className="border-t border-[#E5E5E3] pt-3 mt-3">
                      <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">배송지</p>
                      <div className="space-y-1 text-sm text-[#1A1A1A]">
                        <p className="font-medium">
                          {orderDetail.shipping?.recipientName || orderDetail.recipientName || '-'}
                        </p>
                        <p className="text-[#6B6B6B]">
                          {orderDetail.shipping?.recipientPhone || orderDetail.recipientPhone || '-'}
                        </p>
                        <p className="text-[#6B6B6B]">
                          {orderDetail.shipping?.postalCode && `(${orderDetail.shipping.postalCode}) `}
                          {orderDetail.shipping?.address1 || orderDetail.address1 || ''}
                          {(orderDetail.shipping?.address2 || orderDetail.address2) && ` ${orderDetail.shipping?.address2 || orderDetail.address2}`}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setOrderDetail(null)}
                  className="mt-6 w-full text-center text-sm text-[#6B6B6B] hover:text-[#1A1A1A] font-medium py-2 cursor-pointer transition-colors duration-200"
                >
                  닫기
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
