import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getOrder } from '../api/orderApi'
import { signOut } from '../lib/supabase'
import Footer from '../components/Footer'

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

function getDeliveryDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

export default function Home() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const user = state.user
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [orderUidInput, setOrderUidInput] = useState('')
  const [orderResult, setOrderResult] = useState(null)
  const [orderLoading, setOrderLoading] = useState(false)
  const [orderError, setOrderError] = useState(null)

  const handleOrderLookup = async () => {
    if (!orderUidInput.trim()) return
    setOrderLoading(true)
    setOrderError(null)
    setOrderResult(null)
    try {
      const res = await getOrder(orderUidInput.trim())
      const data = res.data?.data || res.data
      setOrderResult(data)
    } catch {
      setOrderError('주문 정보를 찾을 수 없습니다')
    }
    setOrderLoading(false)
  }

  const handleStart = () => {
    if (!user) {
      navigate('/login')
      return
    }
    navigate('/type-select')
  }

  const handleLogout = async () => {
    await signOut()
    dispatch({ type: 'SET_USER', payload: null })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold text-primary">
          GrowBook
        </Link>
        <div className="flex items-center gap-4">
          {user ? (
            <>
              <Link
                to="/mypage"
                className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200"
              >
                마이페이지
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-[#6B6B6B] hover:text-[#1A1A1A] font-medium cursor-pointer transition-colors duration-200"
              >
                로그아웃
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200"
            >
              로그인
            </Link>
          )}
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4 leading-tight">
            소중한 성장의 순간을<br />한 권의 책으로
          </h1>
          <p className="text-base text-[#6B6B6B] mb-12 leading-relaxed">
            AI가 한 해의 기억을 모아 특별한 앨범을 만들어드립니다
          </p>

          <button
            onClick={handleStart}
            className="w-full max-w-xs mx-auto bg-primary hover:bg-primary-dark text-white text-base font-medium py-4 px-8 rounded-xl transition-colors duration-200 cursor-pointer"
          >
            앨범 만들기 시작
          </button>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-2xl w-full px-4">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              ),
              title: '성장 기록',
              desc: '월별 특별한 순간을 기록하세요',
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
              ),
              title: 'AI 스토리 생성',
              desc: 'AI가 성장 스토리를 만들어드려요',
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              ),
              title: '책 제작 & 배송',
              desc: '실물 앨범으로 받아보세요',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-xl p-6 text-center border border-[#E5E5E3]"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                {item.icon}
              </div>
              <h3 className="font-semibold text-[#1A1A1A] text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-[#6B6B6B]">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />

      {/* Order Lookup Modal */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#1A1A1A]">주문 조회</h3>
              <button
                onClick={() => { setShowOrderModal(false); setOrderResult(null); setOrderError(null); setOrderUidInput('') }}
                className="w-8 h-8 rounded-full hover:bg-[#F0F0EE] flex items-center justify-center text-[#6B6B6B] cursor-pointer transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={orderUidInput}
                onChange={(e) => setOrderUidInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOrderLookup()}
                placeholder="주문번호를 입력하세요"
                className="flex-1 px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
              />
              <button
                onClick={handleOrderLookup}
                disabled={orderLoading || !orderUidInput.trim()}
                className={`text-sm font-medium px-4 py-2.5 rounded-lg transition-colors duration-200 ${
                  orderLoading || !orderUidInput.trim()
                    ? 'bg-[#D1D1CF] text-white cursor-not-allowed'
                    : 'bg-primary hover:bg-primary-dark text-white cursor-pointer'
                }`}
              >
                {orderLoading ? '...' : '조회'}
              </button>
            </div>

            {orderError && <p className="text-sm text-red-500 mb-3">{orderError}</p>}

            {orderResult && (
              <div className="bg-[#F7F7F5] rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">주문번호</p>
                  <p className="text-sm text-[#1A1A1A] font-mono font-semibold">
                    {orderResult.orderUid || orderResult.uid || orderUidInput}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">주문 상태</p>
                  <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                    {ORDER_STATUS[orderResult.status ?? orderResult.orderStatus] || '확인 중'}
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-[#999] uppercase tracking-wider mb-0.5">예상 배송일</p>
                  <p className="text-sm text-[#1A1A1A] font-semibold">{getDeliveryDate()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
