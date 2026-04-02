import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { createBook } from '../api/bookApi'

const STEPS = [
  { id: 1, label: '앨범 데이터 구성 중' },
  { id: 2, label: '표지 정보 설정 중' },
  { id: 3, label: '내지 구성 중' },
  { id: 4, label: '최종 검토 중' },
]

export default function Loading() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()
  const [steps, setSteps] = useState(
    STEPS.map((s) => ({ ...s, status: 'pending' }))
  )
  const [error, setError] = useState(null)
  const running = useRef(false)

  const updateStep = (id, status) => {
    setSteps((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status } : s))
    )
  }

  const run = async () => {
    if (running.current) return
    running.current = true
    setError(null)
    setSteps(STEPS.map((s) => ({ ...s, status: 'pending' })))

    const story = state.generatedStory || {}

    try {
      // Step 1: 앨범 데이터 구성 (POST /api/books/create)
      updateStep(1, 'loading')
      const bookData = {
        title: story.title,
        subtitle: story.subtitle,
        story: story.story,
        highlights: state.highlights,
        coverTemplateUid: state.selectedCoverTemplateUid || '4MY2fokVjkeY',
        contentTemplateUid: state.selectedContentTemplateUid || 'vHA59XPPKqak',
      }
      if (state.coverImageFileName) {
        bookData.coverImageFileName = state.coverImageFileName
      }
      console.log('POST /api/books/create params:', bookData)
      const bookRes = await createBook(bookData)
      const bookUid = bookRes.data?.data?.bookUid || bookRes.data?.bookUid || bookRes.data?.uid
      dispatch({ type: 'SET_BOOK_UID', payload: bookUid })
      updateStep(1, 'done')

      // Step 2~4: 후속 처리 (UI 피드백용)
      for (const stepId of [2, 3, 4]) {
        updateStep(stepId, 'loading')
        await new Promise((resolve) => setTimeout(resolve, 600))
        updateStep(stepId, 'done')
      }

      // 완료 후 /order 이동
      setTimeout(() => navigate('/order'), 500)
    } catch (err) {
      setSteps((prev) =>
        prev.map((s) =>
          s.status === 'loading' ? { ...s, status: 'error' } : s
        )
      )
      setError(err.response?.data?.message || err.message || '오류가 발생했습니다')
      running.current = false
    }
  }

  useEffect(() => {
    run()
  }, [])

  const handleRetry = () => {
    running.current = false
    run()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-sm w-full">
        <h1 className="text-2xl font-bold text-[#1A1A1A] text-center mb-2">
          앨범을 만들고 있어요
        </h1>
        <p className="text-sm text-[#6B6B6B] text-center mb-10">
          잠시만 기다려주세요
        </p>

        {/* Steps */}
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-3">
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                {step.status === 'pending' && (
                  <div className="w-6 h-6 rounded-full border-2 border-[#E5E5E3]" />
                )}
                {step.status === 'loading' && (
                  <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                )}
                {step.status === 'done' && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                  </div>
                )}
                {step.status === 'error' && (
                  <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                    </svg>
                  </div>
                )}
              </div>
              <span
                className={`text-sm font-medium ${
                  step.status === 'done'
                    ? 'text-primary'
                    : step.status === 'error'
                    ? 'text-red-500'
                    : step.status === 'loading'
                    ? 'text-[#1A1A1A]'
                    : 'text-[#ACACAC]'
                }`}
              >
                {step.label}
              </span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mt-8 text-center">
            <p className="text-sm text-red-500 mb-4">{error}</p>
            <button
              onClick={handleRetry}
              className="bg-primary hover:bg-primary-dark text-white text-sm font-medium py-3 px-8 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
