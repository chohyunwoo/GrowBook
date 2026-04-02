import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { getOrder } from '../api/orderApi'

const ORDER_STATUS = {
  20: '결제 완료',
  40: '제작 중',
  60: '발송 완료',
  70: '배송 완료',
  80: '취소됨',
}

function getDeliveryDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

export default function Complete() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!state.orderUid) {
      setLoading(false)
      return
    }
    const fetchOrder = async () => {
      try {
        const res = await getOrder(state.orderUid)
        setOrder(res.data)
      } catch (err) {
        setError('주문 정보를 불러오지 못했습니다')
      } finally {
        setLoading(false)
      }
    }
    fetchOrder()
  }, [state.orderUid])

  const handleNewAlbum = () => {
    dispatch({ type: 'RESET' })
    navigate('/')
  }

  const statusCode = order?.status ?? order?.data?.status ?? 20
  const statusText = ORDER_STATUS[statusCode] || '확인 중'
  const deliveryDate = getDeliveryDate()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-md w-full">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">주문이 완료되었습니다</h1>
        <p className="text-sm text-[#6B6B6B] mb-8">소중한 성장 앨범이 곧 완성됩니다</p>

        {error && (
          <p className="text-sm text-red-500 mb-4">{error}</p>
        )}

        {/* Order Info */}
        <div className="bg-white rounded-xl border border-[#E5E5E3] p-5 mb-8 text-left">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">주문번호</p>
              <p className="text-sm text-[#1A1A1A] font-mono font-semibold">
                {state.orderUid || '-'}
              </p>
            </div>
            <div className="border-t border-[#F0F0EE]" />
            <div>
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">예상 배송일</p>
              <p className="text-sm text-[#1A1A1A] font-semibold">{deliveryDate}</p>
            </div>
            <div className="border-t border-[#F0F0EE]" />
            <div>
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">주문 상태</p>
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                {statusText}
              </span>
            </div>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={handleNewAlbum}
          className="w-full max-w-xs mx-auto bg-primary hover:bg-primary-dark text-white text-base font-medium py-4 px-8 rounded-xl transition-colors duration-200 cursor-pointer"
        >
          홈으로 가기
        </button>
      </div>
    </div>
  )
}
