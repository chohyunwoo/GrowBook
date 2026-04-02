import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

export default function TypeSelect() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const [selected, setSelected] = useState(state.type || 'child')

  const handleSelect = (type) => {
    if (type === 'pet') return
    setSelected(type)
    dispatch({ type: 'SET_TYPE', payload: type })
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center px-6 py-4">
        <button
          onClick={() => navigate('/')}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
      </header>

      {/* Content */}
      <main className="flex-1 flex flex-col items-center px-4 pt-12 pb-16">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">누구의 앨범을 만들까요?</h1>
        <p className="text-sm text-[#6B6B6B] mb-10">앨범 유형을 선택해주세요</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-md w-full">
          {/* 아이 성장 앨범 */}
          <button
            onClick={() => handleSelect('child')}
            className={`relative p-6 rounded-xl border-2 text-left transition-all duration-200 cursor-pointer ${
              selected === 'child'
                ? 'border-primary bg-primary/5'
                : 'border-[#E5E5E3] bg-white hover:border-[#D1D1CF]'
            }`}
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
              selected === 'child' ? 'bg-primary/10 text-primary' : 'bg-[#F0F0EE] text-[#6B6B6B]'
            }`}>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1A1A1A] mb-1">아이 성장 앨범</h3>
            <p className="text-xs text-[#6B6B6B]">아이의 한 해 성장을 기록해요</p>
            {selected === 'child' && (
              <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                </svg>
              </div>
            )}
          </button>

          {/* 반려동물 성장 앨범 */}
          <button
            disabled
            className="relative p-6 rounded-xl border-2 border-[#E5E5E3] bg-white text-left opacity-60 cursor-not-allowed"
          >
            <span className="absolute top-4 right-4 text-[10px] font-medium bg-[#E5E5E3] text-[#6B6B6B] px-2 py-0.5 rounded-full">
              준비 중
            </span>
            <div className="w-10 h-10 rounded-lg bg-[#F0F0EE] text-[#6B6B6B] flex items-center justify-center mb-4">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3.25a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H14.23c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m.729-6.307a3.001 3.001 0 0 0-2.383-2.661 7.03 7.03 0 0 0-.588-.065A.75.75 0 0 0 3 9.342v5.068a.75.75 0 0 0 .662.744c.203.026.405.058.606.097a3.001 3.001 0 0 0 2.365 2.099" />
              </svg>
            </div>
            <h3 className="font-semibold text-[#1A1A1A] mb-1">반려동물 성장 앨범</h3>
            <p className="text-xs text-[#6B6B6B]">반려동물의 특별한 순간을 담아요</p>
          </button>
        </div>

        {/* 다음 버튼 */}
        <button
          onClick={() => navigate('/input-form')}
          className="mt-12 w-full max-w-md bg-primary hover:bg-primary-dark text-white text-base font-medium py-4 rounded-xl transition-colors duration-200 cursor-pointer"
        >
          다음
        </button>
      </main>
    </div>
  )
}
