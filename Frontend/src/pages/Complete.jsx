import { useNavigate } from 'react-router-dom'

const ORDER_NUMBER = 'GRW-20251201-0042'

function getDeliveryDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`
}

export default function Complete() {
  const navigate = useNavigate()
  const deliveryDate = getDeliveryDate()

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="text-center max-w-md w-full">
        {/* Success Icon */}
        <div className="w-16 h-16 bg-[#2D6A4F]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-7 h-7 text-[#2D6A4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">
          주문이 완료되었습니다
        </h1>
        <p className="text-sm text-[#6B6B6B] mb-8">
          소중한 성장 앨범이 곧 완성됩니다
        </p>

        {/* Order Info */}
        <div className="bg-white rounded-xl border border-[#E5E5E3] p-5 mb-8 text-left">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] text-[#999] uppercase tracking-wider mb-1">주문번호</p>
              <p className="text-sm text-[#1A1A1A] font-mono font-semibold">
                {ORDER_NUMBER}
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
              <span className="inline-block px-3 py-1 bg-[#2D6A4F]/10 text-[#2D6A4F] text-xs font-semibold rounded-full">
                결제완료 (PAID)
              </span>
            </div>
          </div>
        </div>

        {/* Action */}
        <button
          onClick={() => navigate('/')}
          className="w-full max-w-xs mx-auto bg-[#2D6A4F] hover:bg-[#245A42] text-white text-base font-medium py-4 px-8 rounded-xl transition-colors duration-200 cursor-pointer"
        >
          새 앨범 만들기
        </button>
      </div>
    </div>
  )
}
