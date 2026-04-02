import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const DUMMY_COVER_IMAGE = 'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=400&h=400&fit=crop'

export default function AlbumView() {
  const navigate = useNavigate()
  const { state } = useApp()
  const [currentPage, setCurrentPage] = useState(0)

  const story = state.generatedStory || {}
  const coverImage = state.coverImagePreview || DUMMY_COVER_IMAGE
  const coverTitle = state.name && state.albumYear
    ? `${state.name}의 ${state.albumYear}년`
    : ''
  const dateRange = state.albumYear ? `${state.albumYear}.01 - ${state.albumYear}.12` : ''

  // Build pages
  const pages = []
  pages.push({ type: 'cover' })
  if (state.generatedStory) {
    pages.push({ type: 'story' })
  }
  const albumType = state.type || 'child'
  if (albumType === 'child' || albumType === 'pet') {
    state.highlights.forEach((h) => {
      pages.push({ type: 'month', month: h.month, content: h.content, caption: h.caption, imagePreview: h.imagePreview })
    })
  } else if (albumType === 'travel') {
    state.highlights.filter((h) => h.content).forEach((h, i) => {
      pages.push({ type: 'travel', index: i, content: h.content, caption: h.caption, imagePreview: h.imagePreview })
    })
  } else if (albumType === 'memory') {
    state.highlights.filter((h) => h.content).forEach((h, i) => {
      pages.push({ type: 'memory', index: i, content: h.content, caption: h.caption, imagePreview: h.imagePreview })
    })
  }

  const totalPages = pages.length
  const safePage = Math.min(currentPage, totalPages - 1)
  const page = pages[safePage] || pages[0]

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/preview')}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="text-center">
          <h2 className="text-base font-semibold text-[#1A1A1A]">최종 앨범 미리보기</h2>
          <p className="text-[10px] text-[#ACACAC]">총 {totalPages}페이지</p>
        </div>
        <div className="w-5" />
      </header>

      <main className="flex-1 px-4 pb-16">
        <div className="max-w-3xl mx-auto">

          {/* Page Slider */}
          <div className="flex items-center justify-center gap-3 mb-2">
            {/* Left Arrow */}
            <button
              onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
              disabled={safePage <= 0}
              className="w-10 h-10 rounded-full flex items-center justify-center text-primary disabled:text-[#D1D1CF] cursor-pointer disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>

            {/* Card */}
            <div className="w-full max-w-sm">
              <div className="aspect-[3/4] rounded-2xl border border-[#E5E5E3] bg-white shadow-sm relative overflow-hidden flex flex-col">

                {/* Cover */}
                {page.type === 'cover' && (
                  <>
                    <div className="absolute inset-0">
                      <img src={coverImage} alt="" className="w-full h-full object-cover opacity-20" />
                    </div>
                    <div className="relative flex-1 flex flex-col items-center justify-center px-6">
                      <img src={coverImage} alt="" className="w-2/5 aspect-square object-cover rounded-xl shadow-lg mb-6" />
                      <h3 className="text-2xl font-bold text-[#1A1A1A] text-center mb-1">
                        {story.title || coverTitle}
                      </h3>
                      <p className="text-sm text-[#6B6B6B] text-center">{story.subtitle || ''}</p>
                    </div>
                    {dateRange && (
                      <div className="relative px-4 pb-4 text-center">
                        <p className="text-xs text-[#ACACAC] font-mono">{dateRange}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Story */}
                {page.type === 'story' && (
                  <div className="flex-1 flex flex-col p-6 overflow-y-auto">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-3">AI 성장 스토리</p>
                    <p className="text-sm text-[#4A4A4A] leading-relaxed whitespace-pre-wrap flex-1">
                      {story.story || ''}
                    </p>
                  </div>
                )}

                {/* Inner pages */}
                {(page.type === 'month' || page.type === 'travel' || page.type === 'memory') && (
                  <div className="flex-1 flex flex-col">
                    {/* Photo */}
                    {page.imagePreview ? (
                      <div className="h-2/5">
                        <img src={page.imagePreview} alt="" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-2/5 bg-[#FAFAF9] flex items-center justify-center">
                        <svg className="w-8 h-8 text-[#E5E5E3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                        </svg>
                      </div>
                    )}
                    {/* Text */}
                    <div className="flex-1 p-5 flex flex-col justify-center">
                      <p className="text-lg font-bold text-primary mb-2">
                        {page.type === 'month' && `${page.month}월`}
                        {page.type === 'travel' && `Day ${page.index + 1}`}
                        {page.type === 'memory' && `순간 ${page.index + 1}`}
                      </p>
                      <p className="text-sm text-[#4A4A4A] leading-relaxed">
                        {page.content || (page.type === 'month' ? '이달은 조용히 흘러갔어요.' : '')}
                      </p>
                      {page.caption && (
                        <p className="text-xs text-primary/80 italic mt-2 leading-relaxed">{page.caption}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Arrow */}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={safePage >= totalPages - 1}
              className="w-10 h-10 rounded-full flex items-center justify-center text-primary disabled:text-[#D1D1CF] cursor-pointer disabled:cursor-not-allowed transition-colors duration-200 flex-shrink-0"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>

          {/* Page Number */}
          <p className="text-center text-xs text-[#6B6B6B] font-medium mb-8">
            {safePage + 1} / {totalPages}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/preview')}
              className="flex-1 border border-[#E5E5E3] text-[#6B6B6B] hover:text-[#1A1A1A] hover:bg-[#F7F7F5] text-base font-medium py-4 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              다시 수정하기
            </button>
            <button
              onClick={() => navigate('/order')}
              className="flex-1 bg-primary hover:bg-primary-dark text-white text-base font-medium py-4 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              주문하기
            </button>
          </div>
        </div>
      </main>
    </div>
  )
}
