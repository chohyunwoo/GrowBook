import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { getAdminStats, getAdminDashboard, getAdminOrders, getAdminOrderDetail, getAdminUsers, getAdminCommunityPosts, deleteAdminPost, getAdminReviews, deleteAdminReview } from '../api/adminApi'

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

  // Community
  const [communityPosts, setCommunityPosts] = useState([])
  const [communityLoading, setCommunityLoading] = useState(false)
  const [communityPage, setCommunityPage] = useState(1)
  const [communityTotalPages, setCommunityTotalPages] = useState(1)
  const COMMUNITY_PER_PAGE = 10

  // Reviews
  const [adminReviews, setAdminReviews] = useState([])
  const [adminReviewsLoading, setAdminReviewsLoading] = useState(false)
  const [adminReviewsPage, setAdminReviewsPage] = useState(1)
  const [adminReviewsTotalPages, setAdminReviewsTotalPages] = useState(1)
  const [reviewDetailModal, setReviewDetailModal] = useState(null)
  const [adminAvgRating, setAdminAvgRating] = useState(0)
  const ADMIN_REVIEWS_PER_PAGE = 10

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
        const dashData = dashRes.data?.data || dashRes.data
        console.log('[Admin] dashboard stats:', dashData?.stats)
        setDashboard(dashData)
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

  // Fetch community posts
  useEffect(() => {
    if (!authorized || activeTab !== 'community') return
    const fetch = async () => {
      setCommunityLoading(true)
      try {
        const token = await getAccessToken()
        const res = await getAdminCommunityPosts(token, { page: communityPage, limit: COMMUNITY_PER_PAGE })
        const body = res.data?.data || res.data || {}
        const raw = Array.isArray(body) ? body : (body.items || body.posts || [])
        setCommunityPosts(raw)
        const pages = (body.totalPages ?? body.total_pages ?? Math.ceil((body.totalCount ?? body.total_count ?? raw.length) / COMMUNITY_PER_PAGE)) || 1
        setCommunityTotalPages(pages)
      } catch { /* ignore */ }
      setCommunityLoading(false)
    }
    fetch()
  }, [authorized, activeTab, communityPage])

  const handleDeletePost = async (postId) => {
    if (!window.confirm('게시글을 삭제할까요?')) return
    try {
      const token = await getAccessToken()
      await deleteAdminPost(token, postId)
      setCommunityPosts((prev) => prev.filter((p) => (p.id || p.postId || p.post_id) !== postId))
    } catch { /* ignore */ }
  }

  // Fetch admin reviews
  useEffect(() => {
    if (!authorized || activeTab !== 'reviews') return
    const fetch = async () => {
      setAdminReviewsLoading(true)
      try {
        const token = await getAccessToken()
        const res = await getAdminReviews(token, { page: adminReviewsPage, limit: ADMIN_REVIEWS_PER_PAGE })
        const body = res.data?.data || res.data || {}
        const raw = Array.isArray(body) ? body : (body.items || body.reviews || [])
        setAdminReviews(raw)
        const pages = (body.totalPages ?? body.total_pages ?? Math.ceil((body.totalCount ?? body.total_count ?? raw.length) / ADMIN_REVIEWS_PER_PAGE)) || 1
        setAdminReviewsTotalPages(pages)
        const avg = body.avgRating ?? body.avg_rating
        if (avg != null) {
          setAdminAvgRating(Math.round(avg * 10) / 10)
        } else if (raw.length > 0) {
          const sum = raw.reduce((acc, r) => acc + (r.rating ?? r.star ?? 0), 0)
          setAdminAvgRating(Math.round((sum / raw.length) * 10) / 10)
        } else {
          setAdminAvgRating(0)
        }
      } catch { /* ignore */ }
      setAdminReviewsLoading(false)
    }
    fetch()
  }, [authorized, activeTab, adminReviewsPage])

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('리뷰를 삭제할까요?')) return
    try {
      const token = await getAccessToken()
      await deleteAdminReview(token, reviewId)
      setAdminReviews((prev) => prev.filter((r) => (r.id || r.reviewId || r.review_id) !== reviewId))
    } catch { /* ignore */ }
  }

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
    { key: 'community', label: '커뮤니티 관리' },
    { key: 'reviews', label: '리뷰 관리' },
  ]

  const balance = dashboard?.credits?.balance ?? dashboard?.balance ?? 0
  const totalOrders = dashboard?.stats?.totalCount ?? dashboard?.totalOrders ?? 0
  const byStatus = dashboard?.stats?.byStatus || dashboard?.statusCounts || {}
  const stats = dashboard?.stats || {}
  const thisMonthCount = stats.thisMonthCount ?? stats.this_month_count ?? 0
  const activeCount = stats.activeCount ?? stats.active_count ?? 0

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
                  <div className="bg-white rounded-xl border border-[#E5E5E3] p-6">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">이번 달 주문</p>
                    <p className="text-3xl font-bold text-[#1A1A1A]">{thisMonthCount.toLocaleString()}건</p>
                  </div>
                  <div className="bg-white rounded-xl border border-[#E5E5E3] p-6">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">실제 주문 수 (취소 제외)</p>
                    <p className="text-3xl font-bold text-[#1A1A1A]">{activeCount.toLocaleString()}건</p>
                    {totalOrders > 0 && (
                      <p className="text-sm text-[#6B6B6B] mt-1">전체 {totalOrders.toLocaleString()}건 중 취소 제외 {activeCount.toLocaleString()}건</p>
                    )}
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

                {/* Status Progress Bars */}
                {totalOrders > 0 && (() => {
                  const bars = [
                    { label: '결제완료', value: (byStatus[20] ?? 0) + (byStatus[25] ?? 0) + (byStatus[30] ?? 0), bg: 'bg-blue-400' },
                    { label: '제작 중', value: (byStatus[40] ?? 0) + (byStatus[50] ?? 0), bg: 'bg-yellow-400' },
                    { label: '배송 중', value: byStatus[60] ?? 0, bg: 'bg-purple-400' },
                    { label: '배송 완료', value: byStatus[70] ?? 0, bg: 'bg-green-400' },
                    { label: '취소', value: (byStatus[80] ?? 0) + (byStatus[81] ?? 0), bg: 'bg-red-400' },
                  ]
                  return (
                    <div className="bg-white rounded-xl border border-[#E5E5E3] p-6 mt-4">
                      <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-4">주문 현황 그래프</p>
                      <div className="space-y-3">
                        {bars.map((bar) => {
                          const pct = Math.round((bar.value / totalOrders) * 100)
                          return (
                            <div key={bar.label}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-[#1A1A1A]">{bar.label}</span>
                                <span className="text-xs text-[#6B6B6B]">{bar.value}건 ({pct}%)</span>
                              </div>
                              <div className="w-full h-3 bg-[#F0F0EE] rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${bar.bg}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}
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
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">수량</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">금액</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">주문일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orders.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="text-center py-12 text-[#ACACAC] text-sm">주문이 없습니다</td>
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
                              <td className="px-4 py-3 text-[#1A1A1A]">{order.quantity ?? 1}권</td>
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
          {/* Community Tab */}
          {activeTab === 'community' && (
            communityLoading ? <Spinner /> : (
              <div className="space-y-4">
                <div className="bg-white rounded-xl border border-[#E5E5E3] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E5E3] bg-[#F7F7F5]">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">제목</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">작성자</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">타입</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">좋아요</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">댓글</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">작성일</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {communityPosts.length === 0 ? (
                          <tr><td colSpan={7} className="text-center py-12 text-[#ACACAC] text-sm">게시글이 없습니다</td></tr>
                        ) : communityPosts.map((p) => {
                          const pId = p.id || p.postId || p.post_id
                          return (
                            <tr key={pId} className="border-b border-[#F0F0EE]">
                              <td className="px-4 py-3 text-[#1A1A1A] truncate max-w-[200px]">{p.title || '-'}</td>
                              <td className="px-4 py-3 text-[#6B6B6B]">{p.authorName || p.author_name || p.author || '-'}</td>
                              <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">{p.type || p.album_type || '-'}</span></td>
                              <td className="px-4 py-3 text-[#1A1A1A]">{p.likes ?? p.likeCount ?? p.like_count ?? 0}</td>
                              <td className="px-4 py-3 text-[#1A1A1A]">{p.comments ?? p.commentCount ?? p.comment_count ?? 0}</td>
                              <td className="px-4 py-3 text-[#6B6B6B]">{p.createdAt || p.created_at ? new Date(p.createdAt || p.created_at).toLocaleDateString('ko-KR') : '-'}</td>
                              <td className="px-4 py-3">
                                <button onClick={() => handleDeletePost(pId)} className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors duration-200">삭제</button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                {communityTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-4">
                    <button onClick={() => setCommunityPage((p) => Math.max(1, p - 1))} disabled={communityPage === 1} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${communityPage === 1 ? 'text-[#D1D1CF] cursor-not-allowed' : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'}`}>&lt;</button>
                    {Array.from({ length: communityTotalPages }, (_, i) => i + 1).map((page) => (
                      <button key={page} onClick={() => setCommunityPage(page)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${page === communityPage ? 'bg-primary text-white' : 'bg-white text-[#6B6B6B] border border-[#E5E5E3] hover:bg-[#F7F7F5]'}`}>{page}</button>
                    ))}
                    <button onClick={() => setCommunityPage((p) => Math.min(communityTotalPages, p + 1))} disabled={communityPage === communityTotalPages} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${communityPage === communityTotalPages ? 'text-[#D1D1CF] cursor-not-allowed' : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'}`}>&gt;</button>
                  </div>
                )}
              </div>
            )
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            adminReviewsLoading ? <Spinner /> : (
              <div className="space-y-4">
                {adminReviews.length > 0 && (
                  <div className="bg-white rounded-xl border border-[#E5E5E3] p-5 text-center">
                    <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">평균 별점</p>
                    <p className="text-3xl font-bold text-yellow-500">⭐ {adminAvgRating} <span className="text-lg text-[#ACACAC] font-normal">/ 5.0</span></p>
                    <p className="text-xs text-[#ACACAC] mt-1">{adminReviews.length}개의 리뷰</p>
                  </div>
                )}
                <div className="bg-white rounded-xl border border-[#E5E5E3] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#E5E5E3] bg-[#F7F7F5]">
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">작성자</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">타입</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">별점</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">내용</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider">작성일</th>
                          <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminReviews.length === 0 ? (
                          <tr><td colSpan={6} className="text-center py-12 text-[#ACACAC] text-sm">리뷰가 없습니다</td></tr>
                        ) : adminReviews.map((r) => {
                          const rId = r.id || r.reviewId || r.review_id
                          const rRating = r.rating ?? r.star ?? 0
                          const rContent = r.content || ''
                          return (
                            <tr key={rId} className="border-b border-[#F0F0EE]">
                              <td className="px-4 py-3 text-[#1A1A1A] font-medium">{r.authorName || r.author_name || r.author || r.authorEmail || r.author_email || '알 수 없음'}</td>
                              <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-full">{{ child: '아이 성장 포토북', pet: '반려동물 포토북', travel: '여행 포토북', memory: '추억 포토북' }[r.type || r.album_type || r.albumType] || r.type || r.album_type || '-'}</span></td>
                              <td className="px-4 py-3 text-yellow-500 text-xs">{'★'.repeat(rRating)}{'☆'.repeat(5 - rRating)}</td>
                              <td className="px-4 py-3 text-[#6B6B6B] truncate max-w-[200px]">{rContent.length > 30 ? rContent.slice(0, 30) + '...' : rContent || '-'}</td>
                              <td className="px-4 py-3 text-[#6B6B6B]">{r.createdAt || r.created_at ? new Date(r.createdAt || r.created_at).toLocaleDateString('ko-KR') : '-'}</td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <button onClick={() => setReviewDetailModal(r)} className="text-xs text-primary hover:text-primary-dark font-medium cursor-pointer transition-colors duration-200">상세보기</button>
                                  <button onClick={() => handleDeleteReview(rId)} className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors duration-200">삭제</button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                {adminReviewsTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-4">
                    <button onClick={() => setAdminReviewsPage((p) => Math.max(1, p - 1))} disabled={adminReviewsPage === 1} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${adminReviewsPage === 1 ? 'text-[#D1D1CF] cursor-not-allowed' : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'}`}>&lt;</button>
                    {Array.from({ length: adminReviewsTotalPages }, (_, i) => i + 1).map((page) => (
                      <button key={page} onClick={() => setAdminReviewsPage(page)} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${page === adminReviewsPage ? 'bg-primary text-white' : 'bg-white text-[#6B6B6B] border border-[#E5E5E3] hover:bg-[#F7F7F5]'}`}>{page}</button>
                    ))}
                    <button onClick={() => setAdminReviewsPage((p) => Math.min(adminReviewsTotalPages, p + 1))} disabled={adminReviewsPage === adminReviewsTotalPages} className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${adminReviewsPage === adminReviewsTotalPages ? 'text-[#D1D1CF] cursor-not-allowed' : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'}`}>&gt;</button>
                  </div>
                )}
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

      {/* Review Detail Modal */}
      {reviewDetailModal && (() => {
        const rd = reviewDetailModal
        const rdType = rd.type || rd.album_type || rd.albumType
        const rdRating = rd.rating ?? rd.star ?? 0
        const rdAuthor = rd.authorName || rd.author_name || rd.author || rd.authorEmail || rd.author_email || '알 수 없음'
        const rdDate = rd.createdAt || rd.created_at
        const rdId = rd.id || rd.reviewId || rd.review_id
        const rdImgs = (() => {
          const src = rd.image_urls || rd.imageUrls || rd.images
          if (Array.isArray(src)) return src
          if (typeof src === 'string') { try { const p = JSON.parse(src); if (Array.isArray(p)) return p } catch {} }
          return []
        })()
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setReviewDetailModal(null)}>
            <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">리뷰 상세</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[#1A1A1A]">{rdAuthor}</span>
                  {rdDate && <span className="text-xs text-[#ACACAC]">{new Date(rdDate).toLocaleDateString('ko-KR')}</span>}
                </div>
                <div className="flex items-center gap-2">
                  {rdType && (
                    <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                      {{ child: '아이 성장 포토북', pet: '반려동물 포토북', travel: '여행 포토북', memory: '추억 포토북' }[rdType] || rdType}
                    </span>
                  )}
                  {rdRating > 0 && (
                    <span className="text-sm text-yellow-500">{'★'.repeat(rdRating)}{'☆'.repeat(5 - rdRating)}</span>
                  )}
                </div>
                {rdImgs.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {rdImgs.map((src, i) => (
                      <img key={i} src={src} alt="" className="w-24 h-24 rounded-lg object-cover border border-[#E5E5E3]" />
                    ))}
                  </div>
                )}
                {rd.content && (
                  <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-line">{rd.content}</p>
                )}
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setReviewDetailModal(null)}
                  className="flex-1 border border-[#E5E5E3] text-[#6B6B6B] text-sm font-medium py-3 rounded-xl hover:bg-[#F7F7F5] transition-colors duration-200 cursor-pointer"
                >
                  닫기
                </button>
                <button
                  onClick={() => { handleDeleteReview(rdId); setReviewDetailModal(null) }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-3 rounded-xl transition-colors duration-200 cursor-pointer"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
