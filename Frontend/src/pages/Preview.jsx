import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const DUMMY_PAGES = [
  {
    id: 1,
    layout: 'full',
    photos: ['https://picsum.photos/seed/baby1/600/400'],
    caption: '우리 아기의 첫 번째 미소',
  },
  {
    id: 2,
    layout: 'grid',
    photos: [
      'https://picsum.photos/seed/baby2/300/300',
      'https://picsum.photos/seed/baby3/300/300',
    ],
    caption: '신나는 하루하루',
  },
  {
    id: 3,
    layout: 'full',
    photos: ['https://picsum.photos/seed/baby4/600/400'],
    caption: '맛있는 이유식 시간',
  },
  {
    id: 4,
    layout: 'grid',
    photos: [
      'https://picsum.photos/seed/baby5/300/300',
      'https://picsum.photos/seed/baby6/300/300',
    ],
    caption: '사랑스러운 매일',
  },
]

const DUMMY_STORIES = [
  '2025년, 지호의 첫 해는 매 순간이 기적이었어요. 1월의 어느 아침, 처음으로 "엄마"라는 말을 뱉던 그 순간은 온 가족이 눈물을 흘렸죠. 봄이 되자 어린이집에서 새로운 친구들을 만났고, 여름엔 파란 바다에서 첫 수영에 도전했어요. 이 한 해는 지호가 세상을 처음 만나가는 눈부신 여정이었습니다.',
  '한 살 한 살 자라는 지호의 2025년은 설렘으로 가득했습니다. 작은 입술로 처음 엄마를 불렀던 1월, 새 친구들을 만난 어린이집 첫날, 여름 바다의 파도 앞에서도 용감했던 지호. 이 모든 순간들이 모여 하나의 빛나는 이야기가 되었습니다.',
]

export default function Preview() {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(0)
  const [storyIndex, setStoryIndex] = useState(0)

  const page = DUMMY_PAGES[currentPage]
  const totalPages = DUMMY_PAGES.length

  const regenerateStory = () => {
    setStoryIndex((prev) => (prev + 1) % DUMMY_STORIES.length)
  }

  return (
    <div className="min-h-screen px-4 py-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1">앨범 미리보기</h1>
        <p className="text-sm text-[#6B6B6B]">완성될 앨범을 확인해보세요</p>
      </div>

      {/* Album Preview */}
      <div className="bg-white rounded-xl border border-[#E5E5E3] p-6 mb-6">
        {/* Page indicator */}
        <div className="text-xs text-[#6B6B6B] text-center mb-4 font-mono">
          {currentPage + 1} / {totalPages}
        </div>

        {/* Photo area */}
        {page.layout === 'full' ? (
          <div className="aspect-[3/2] rounded-lg overflow-hidden mb-4">
            <img
              src={page.photos[0]}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 mb-4">
            {page.photos.map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden">
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Caption */}
        <p className="text-center text-[#1A1A1A] text-sm font-medium">{page.caption}</p>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={currentPage === 0}
          className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E3] flex items-center justify-center text-[#6B6B6B] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex gap-1.5">
          {DUMMY_PAGES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i)}
              className={`w-2 h-2 rounded-full transition-colors cursor-pointer ${
                i === currentPage ? 'bg-[#2D6A4F]' : 'bg-[#D1D1CF]'
              }`}
            />
          ))}
        </div>
        <button
          onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={currentPage === totalPages - 1}
          className="w-9 h-9 rounded-lg bg-white border border-[#E5E5E3] flex items-center justify-center text-[#6B6B6B] disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed hover:border-[#2D6A4F] hover:text-[#2D6A4F] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
          </svg>
        </button>
      </div>

      {/* Story Section */}
      <div className="bg-white rounded-xl border border-[#E5E5E3] p-5 mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-[#1A1A1A] uppercase tracking-wider">
            AI 생성 스토리
          </h3>
          <button
            onClick={regenerateStory}
            className="flex items-center gap-1.5 text-xs text-[#2D6A4F] font-medium hover:text-[#245A42] transition-colors cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182M2.985 19.644l3.181-3.183" />
            </svg>
            재생성
          </button>
        </div>
        <p className="text-sm text-[#4A4A4A] leading-relaxed">
          {DUMMY_STORIES[storyIndex]}
        </p>
      </div>

      {/* Navigation */}
      <div className="flex gap-3">
        <button
          onClick={() => navigate('/upload')}
          className="flex-1 py-3 rounded-xl border border-[#D1D1CF] text-[#6B6B6B] font-medium text-sm hover:bg-[#EEEEEC] transition-colors cursor-pointer"
        >
          이전
        </button>
        <button
          onClick={() => navigate('/edit-cover')}
          className="flex-1 py-3 rounded-xl bg-[#2D6A4F] text-white font-medium text-sm hover:bg-[#245A42] transition-colors cursor-pointer"
        >
          다음: 표지 편집
        </button>
      </div>
    </div>
  )
}
