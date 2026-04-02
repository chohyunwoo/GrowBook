import { useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'

const SAMPLE_DATA = {
  name: '지호',
  birthYear: '2022',
  albumYear: '2025',
  highlights: [
    { month: 1, content: '처음으로 "엄마"라고 말했어요' },
    { month: 2, content: '' },
    { month: 3, content: '어린이집을 시작했어요' },
    { month: 4, content: '' },
    { month: 5, content: '자전거를 처음 탔어요' },
    { month: 6, content: '' },
    { month: 7, content: '바다에서 처음 수영했어요' },
    { month: 8, content: '' },
    { month: 9, content: '' },
    { month: 10, content: '할로윈 파티에서 호박 분장을 했어요' },
    { month: 11, content: '' },
    { month: 12, content: '산타할아버지를 처음 만났어요' },
  ],
}

export default function InputForm() {
  const navigate = useNavigate()
  const { state, dispatch } = useApp()

  const fillSample = () => {
    dispatch({ type: 'SET_NAME', payload: SAMPLE_DATA.name })
    dispatch({ type: 'SET_BIRTH_YEAR', payload: SAMPLE_DATA.birthYear })
    dispatch({ type: 'SET_ALBUM_YEAR', payload: SAMPLE_DATA.albumYear })
    dispatch({ type: 'SET_HIGHLIGHTS', payload: SAMPLE_DATA.highlights })
  }

  const handleNext = () => {
    if (!state.name || !state.birthYear || !state.albumYear) return
    navigate('/loading')
  }

  const isValid = state.name && state.birthYear && state.albumYear

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/type-select')}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={fillSample}
            className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200 cursor-pointer"
          >
            샘플로 체험하기
          </button>
          <button
            onClick={() => {
              dispatch({ type: 'SET_NAME', payload: '' })
              dispatch({ type: 'SET_BIRTH_YEAR', payload: '' })
              dispatch({ type: 'SET_ALBUM_YEAR', payload: '' })
              dispatch({ type: 'SET_HIGHLIGHTS', payload: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, content: '' })) })
            }}
            className="text-sm text-primary border border-primary hover:bg-primary/5 font-medium px-3 py-1 rounded-lg transition-colors duration-200 cursor-pointer"
          >
            초기화
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 px-4 pb-16">
        <div className="max-w-lg mx-auto">
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-1 mt-4">기본 정보</h1>
          <p className="text-sm text-[#6B6B6B] mb-8">아이의 정보를 입력해주세요</p>

          {/* 기본 정보 */}
          <div className="space-y-4 mb-10">
            <div>
              <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">이름</label>
              <input
                type="text"
                value={state.name}
                onChange={(e) => dispatch({ type: 'SET_NAME', payload: e.target.value })}
                placeholder="아이 이름을 입력하세요"
                className="w-full px-4 py-3 rounded-xl border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">태어난 연도</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={state.birthYear}
                  onChange={(e) => dispatch({ type: 'SET_BIRTH_YEAR', payload: e.target.value })}
                  placeholder="예: 2022"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1A1A1A] mb-1.5">앨범 연도</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={state.albumYear}
                  onChange={(e) => dispatch({ type: 'SET_ALBUM_YEAR', payload: e.target.value })}
                  placeholder="예: 2025"
                  className="w-full px-4 py-3 rounded-xl border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                />
              </div>
            </div>
          </div>

          {/* 월별 하이라이트 */}
          <h2 className="text-lg font-bold text-[#1A1A1A] mb-1">월별 하이라이트</h2>
          <p className="text-sm text-[#6B6B6B] mb-6">각 달의 특별한 순간을 기록해주세요</p>

          <div className="grid grid-cols-2 gap-3">
            {state.highlights.map((h) => (
              <div key={h.month}>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{h.month}월</label>
                <textarea
                  value={h.content}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_HIGHLIGHT',
                      payload: { month: h.month, content: e.target.value },
                    })
                  }
                  placeholder="이달의 특별한 순간을 적어주세요"
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] resize-none focus:outline-none focus:border-primary transition-colors duration-200"
                />
              </div>
            ))}
          </div>

          {/* 다음 버튼 */}
          <button
            onClick={handleNext}
            disabled={!isValid}
            className={`mt-10 w-full text-white text-base font-medium py-4 rounded-xl transition-colors duration-200 ${
              isValid
                ? 'bg-primary hover:bg-primary-dark cursor-pointer'
                : 'bg-[#D1D1CF] cursor-not-allowed'
            }`}
          >
            다음
          </button>
        </div>
      </main>
    </div>
  )
}
