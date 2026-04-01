import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const COVER_COLORS = [
  { name: '크림', value: '#FFF8E7' },
  { name: '피치', value: '#FFDAB9' },
  { name: '라벤더', value: '#E6E0F3' },
  { name: '민트', value: '#D5EFE3' },
  { name: '로즈', value: '#F5D5D5' },
]

export default function EditCover() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('우리 아기 성장 앨범')
  const [subtitle, setSubtitle] = useState('2025년의 소중한 기록')
  const [coverColor, setCoverColor] = useState(COVER_COLORS[0].value)

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">표지 편집</h1>
        <p className="text-sm text-[#6B6B6B]">앨범 표지를 꾸며보세요</p>
      </div>

      {/* Cover Preview */}
      <div
        className="rounded-xl shadow-sm border border-[#E5E5E3] p-8 mb-8 aspect-[3/4] max-w-xs mx-auto flex flex-col items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: coverColor }}
      >
        {/* Book icon */}
        <svg className="w-10 h-10 text-[#2D6A4F] mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
        <h2 className="text-xl font-bold text-[#1A1A1A] text-center mb-2 break-words max-w-full">
          {title || '제목을 입력하세요'}
        </h2>
        <p className="text-xs text-[#6B6B6B] text-center break-words max-w-full">
          {subtitle || '부제를 입력하세요'}
        </p>
        <div className="mt-auto pt-8">
          <p className="text-[10px] text-[#999] tracking-widest uppercase">GrowBook</p>
        </div>
      </div>

      {/* Edit Form */}
      <div className="space-y-5 mb-8">
        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
            앨범 제목
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={20}
            className="w-full px-4 py-3 rounded-xl border border-[#E5E5E3] bg-white text-[#1A1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-1.5">
            부제
          </label>
          <input
            type="text"
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            maxLength={30}
            className="w-full px-4 py-3 rounded-xl border border-[#E5E5E3] bg-white text-[#1A1A1A] text-sm focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]/30 focus:border-[#2D6A4F]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#1A1A1A] mb-2">
            표지 색상
          </label>
          <div className="flex gap-3 justify-center">
            {COVER_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setCoverColor(color.value)}
                className={`w-9 h-9 rounded-full border-2 transition-all cursor-pointer ${
                  coverColor === color.value
                    ? 'border-[#2D6A4F] scale-110 shadow-sm'
                    : 'border-[#E5E5E3] hover:border-[#999]'
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/preview')}
          className="flex-1 py-3 rounded-xl border border-[#D1D1CF] text-[#6B6B6B] font-medium text-sm hover:bg-[#EEEEEC] transition-colors cursor-pointer"
        >
          이전
        </button>
        <button
          onClick={() => navigate('/order')}
          className="flex-1 py-3 rounded-xl bg-[#2D6A4F] text-white font-medium text-sm hover:bg-[#245A42] transition-colors cursor-pointer"
        >
          다음: 주문하기
        </button>
      </div>
    </div>
  )
}
