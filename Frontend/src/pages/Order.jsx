import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PRICE = {
  item: 60400,
  shipping: 3500,
  packaging: 500,
}
const TOTAL = PRICE.item + PRICE.shipping + PRICE.packaging

export default function Order() {
  const navigate = useNavigate()
  const [addressOpen, setAddressOpen] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    zipCode: '',
    address: '',
    addressDetail: '',
  })
  const [savedForm, setSavedForm] = useState(null)

  const updateForm = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    setSavedForm({ ...form })
    setSaved(true)
    setAddressOpen(false)
  }

  const handleCancel = () => {
    if (savedForm) {
      setForm({ ...savedForm })
    } else {
      setForm({ name: '', phone: '', zipCode: '', address: '', addressDetail: '' })
    }
    setAddressOpen(false)
  }

  const inputClass =
    'w-full px-4 py-3 rounded-xl border border-[#E5E5E3] bg-white text-[#1A1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F] placeholder:text-[#ACACAC]'

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">주문하기</h1>
        <p className="text-sm text-[#6B6B6B]">주문 내역을 확인해주세요</p>
      </div>

      {/* Price Summary Card */}
      <div className="bg-white rounded-xl border border-[#E5E5E3] p-5 mb-6">
        <h3 className="text-xs font-medium text-[#1A1A1A] mb-4 uppercase tracking-wider">예상 금액</h3>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between text-[#6B6B6B]">
            <span>상품 금액</span>
            <span>{PRICE.item.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-[#6B6B6B]">
            <span>배송비</span>
            <span>{PRICE.shipping.toLocaleString()}원</span>
          </div>
          <div className="flex justify-between text-[#6B6B6B]">
            <span>포장비</span>
            <span>{PRICE.packaging.toLocaleString()}원</span>
          </div>
          <div className="border-t border-[#E5E5E3] pt-3 mt-3 flex justify-between font-bold text-[#1A1A1A]">
            <span>총 결제 금액</span>
            <span className="text-[#2D6A4F] text-lg">
              {TOTAL.toLocaleString()}원
            </span>
          </div>
        </div>
      </div>

      {/* Shipping Address - Collapsible */}
      <div className="bg-white rounded-xl border border-[#E5E5E3] mb-8 overflow-hidden">
        {/* Toggle Header */}
        <button
          onClick={() => setAddressOpen(!addressOpen)}
          className="w-full flex items-center justify-between p-5 cursor-pointer hover:bg-[#FAFAF9] transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg className="w-4 h-4 text-[#2D6A4F]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </svg>
            <span className="text-xs font-medium text-[#1A1A1A] uppercase tracking-wider">배송지 정보</span>
            {saved && (
              <span className="text-[10px] text-[#2D6A4F] bg-[#2D6A4F]/10 px-2 py-0.5 rounded-full font-medium">
                저장됨
              </span>
            )}
          </div>
          <svg
            className={`w-4 h-4 text-[#6B6B6B] transition-transform duration-200 ${addressOpen ? 'rotate-180' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </button>

        {/* Saved Address Preview */}
        {!addressOpen && saved && savedForm && (
          <div className="px-5 pb-4 text-sm text-[#6B6B6B]">
            <p>{savedForm.name} / {savedForm.phone}</p>
            <p>{savedForm.address} {savedForm.addressDetail}</p>
          </div>
        )}

        {/* Expandable Form */}
        {addressOpen && (
          <div className="px-5 pb-5 border-t border-[#F0F0EE]">
            <div className="space-y-3 pt-4">
              <input
                type="text"
                placeholder="받는 사람"
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                className={inputClass}
              />
              <input
                type="tel"
                placeholder="전화번호 (예: 010-1234-5678)"
                value={form.phone}
                onChange={(e) => updateForm('phone', e.target.value)}
                className={inputClass}
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="우편번호"
                  value={form.zipCode}
                  onChange={(e) => updateForm('zipCode', e.target.value)}
                  className={`${inputClass} flex-1`}
                />
                <button className="px-4 py-3 rounded-xl border border-[#2D6A4F] text-[#2D6A4F] font-medium text-xs hover:bg-[#2D6A4F]/5 transition-colors cursor-pointer whitespace-nowrap">
                  주소 검색
                </button>
              </div>
              <input
                type="text"
                placeholder="주소"
                value={form.address}
                onChange={(e) => updateForm('address', e.target.value)}
                className={inputClass}
              />
              <input
                type="text"
                placeholder="상세주소"
                value={form.addressDetail}
                onChange={(e) => updateForm('addressDetail', e.target.value)}
                className={inputClass}
              />
            </div>

            {/* Save / Cancel Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 rounded-xl border border-[#D1D1CF] text-[#6B6B6B] font-medium text-sm hover:bg-[#EEEEEC] transition-colors cursor-pointer"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-2.5 rounded-xl bg-[#2D6A4F] text-white font-medium text-sm hover:bg-[#245A42] transition-colors cursor-pointer"
              >
                저장
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/edit-cover')}
          className="flex-1 py-3 rounded-xl border border-[#D1D1CF] text-[#6B6B6B] font-medium text-sm hover:bg-[#EEEEEC] transition-colors cursor-pointer"
        >
          이전
        </button>
        <button
          onClick={() => navigate('/complete')}
          className="flex-1 py-3 rounded-xl bg-[#2D6A4F] text-white font-medium text-sm hover:bg-[#245A42] transition-colors cursor-pointer"
        >
          주문 완료
        </button>
      </div>
    </div>
  )
}
