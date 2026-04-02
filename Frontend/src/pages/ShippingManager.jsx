import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'shipping_addresses'

function loadAddresses() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

function saveAddresses(addresses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(addresses))
}

const EMPTY_FORM = {
  recipient_name: '',
  recipient_phone: '',
  postal_code: '',
  address1: '',
  address2: '',
  memo: '',
}

export default function ShippingManager({ embedded = false }) {
  const navigate = useNavigate()
  const [addresses, setAddresses] = useState(loadAddresses)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)

  useEffect(() => {
    saveAddresses(addresses)
  }, [addresses])

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    if (!form.recipient_name || !form.recipient_phone || !form.address1) return
    const newAddress = {
      ...form,
      id: Date.now(),
      is_default: addresses.length === 0,
    }
    setAddresses((prev) => [...prev, newAddress])
    setForm(EMPTY_FORM)
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id)
      if (filtered.length > 0 && !filtered.some((a) => a.is_default)) {
        filtered[0].is_default = true
      }
      return filtered
    })
  }

  const handleSetDefault = (id) => {
    setAddresses((prev) =>
      prev.map((a) => ({ ...a, is_default: a.id === id }))
    )
  }

  const content = (
    <>
          {/* Address List */}
          {addresses.length === 0 && !showForm && (
            <div className="text-center py-16">
              <p className="text-sm text-[#6B6B6B] mb-2">저장된 배송지가 없습니다</p>
              <p className="text-xs text-[#ACACAC]">새 배송지를 추가해주세요</p>
            </div>
          )}

          <div className="space-y-3 mb-6">
            {addresses.map((addr) => (
              <div
                key={addr.id}
                className="bg-white rounded-xl border border-[#E5E5E3] p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[#1A1A1A]">{addr.recipient_name}</p>
                    {addr.is_default && (
                      <span className="text-[10px] font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        기본 배송지
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-[#6B6B6B] mb-0.5">{addr.recipient_phone}</p>
                <p className="text-sm text-[#6B6B6B]">
                  {addr.postal_code && `(${addr.postal_code}) `}{addr.address1}{addr.address2 && ` ${addr.address2}`}
                </p>
                {addr.memo && <p className="text-xs text-[#ACACAC] mt-1">{addr.memo}</p>}

                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[#F0F0EE]">
                  {!addr.is_default && (
                    <button
                      onClick={() => handleSetDefault(addr.id)}
                      className="text-xs text-primary hover:text-primary-dark font-medium cursor-pointer transition-colors duration-200"
                    >
                      기본으로 설정
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(addr.id)}
                    className="text-xs text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors duration-200"
                  >
                    삭제
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add Form */}
          {showForm ? (
            <div className="bg-white rounded-xl border border-[#E5E5E3] p-5">
              <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">새 배송지 추가</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">받는 사람</label>
                  <input
                    type="text"
                    value={form.recipient_name}
                    onChange={(e) => handleChange('recipient_name', e.target.value)}
                    placeholder="이름을 입력하세요"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">전화번호</label>
                  <input
                    type="tel"
                    value={form.recipient_phone}
                    onChange={(e) => handleChange('recipient_phone', e.target.value)}
                    placeholder="010-0000-0000"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">우편번호</label>
                  <input
                    type="text"
                    value={form.postal_code}
                    onChange={(e) => handleChange('postal_code', e.target.value)}
                    placeholder="우편번호"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">주소</label>
                  <input
                    type="text"
                    value={form.address1}
                    onChange={(e) => handleChange('address1', e.target.value)}
                    placeholder="주소를 입력하세요"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">상세주소</label>
                  <input
                    type="text"
                    value={form.address2}
                    onChange={(e) => handleChange('address2', e.target.value)}
                    placeholder="상세주소를 입력하세요"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#6B6B6B] mb-1">배송 메모</label>
                  <input
                    type="text"
                    value={form.memo}
                    onChange={(e) => handleChange('memo', e.target.value)}
                    placeholder="배송 메모를 입력하세요"
                    className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={() => { setForm(EMPTY_FORM); setShowForm(false) }}
                  className="flex-1 border border-[#E5E5E3] text-[#6B6B6B] text-sm font-medium py-3 rounded-xl hover:bg-[#F7F7F5] transition-colors duration-200 cursor-pointer"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={!form.recipient_name || !form.recipient_phone || !form.address1}
                  className={`flex-1 text-white text-sm font-medium py-3 rounded-xl transition-colors duration-200 ${
                    form.recipient_name && form.recipient_phone && form.address1
                      ? 'bg-primary hover:bg-primary-dark cursor-pointer'
                      : 'bg-[#D1D1CF] cursor-not-allowed'
                  }`}
                >
                  저장
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full border-2 border-dashed border-[#E5E5E3] hover:border-primary text-[#6B6B6B] hover:text-primary text-sm font-medium py-4 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              + 새 배송지 추가
            </button>
          )}
    </>
  )

  if (embedded) return content

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate(-1)}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-[#1A1A1A]">배송지 관리</h2>
        <div className="w-5" />
      </header>
      <main className="flex-1 px-4 pb-16">
        <div className="max-w-lg mx-auto">
          {content}
        </div>
      </main>
    </div>
  )
}
