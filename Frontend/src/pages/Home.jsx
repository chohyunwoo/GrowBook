import { Link, useNavigate } from 'react-router-dom'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold text-primary">
          GrowBook
        </Link>
        <Link
          to="/shipping"
          className="text-sm text-primary hover:text-primary-dark transition-colors duration-200"
        >
          배송지 관리
        </Link>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="text-center max-w-lg">
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4 leading-tight">
            소중한 성장의 순간을<br />한 권의 책으로
          </h1>
          <p className="text-base text-[#6B6B6B] mb-12 leading-relaxed">
            AI가 한 해의 기억을 모아 특별한 앨범을 만들어드립니다
          </p>

          <button
            onClick={() => navigate('/type-select')}
            className="w-full max-w-xs mx-auto bg-primary hover:bg-primary-dark text-white text-base font-medium py-4 px-8 rounded-xl transition-colors duration-200 cursor-pointer"
          >
            앨범 만들기 시작
          </button>
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-5 max-w-2xl w-full px-4">
          {[
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                </svg>
              ),
              title: '성장 기록',
              desc: '월별 특별한 순간을 기록하세요',
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 0 0-2.455 2.456Z" />
                </svg>
              ),
              title: 'AI 스토리 생성',
              desc: 'AI가 성장 스토리를 만들어드려요',
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                </svg>
              ),
              title: '책 제작 & 배송',
              desc: '실물 앨범으로 받아보세요',
            },
          ].map((item) => (
            <div
              key={item.title}
              className="bg-white rounded-xl p-6 text-center border border-[#E5E5E3]"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center mx-auto mb-3">
                {item.icon}
              </div>
              <h3 className="font-semibold text-[#1A1A1A] text-sm mb-1">{item.title}</h3>
              <p className="text-xs text-[#6B6B6B]">{item.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
