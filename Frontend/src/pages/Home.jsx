import { useNavigate } from 'react-router-dom'
import { getCredits } from '../api/creditsApi'

export default function Home() {
  const navigate = useNavigate()

  const handleStart = async () => {
    try {
      const res = await getCredits()
      console.log('크레딧 조회 성공:', res.data)
    } catch (err) {
      console.error('크레딧 조회 실패:', err)
    }
    navigate('/type-select')
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Hero */}
      <div className="text-center max-w-lg">
        {/* Logo Mark */}
        <div className="w-16 h-16 border-2 border-[#2D6A4F] rounded-2xl flex items-center justify-center mx-auto mb-8">
          <span className="text-[#2D6A4F] font-bold text-xl tracking-tighter">G</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-[#1A1A1A] mb-4 tracking-tight">
          GrowBook
        </h1>
        <p className="text-base text-[#6B6B6B] mb-2 leading-relaxed">
          아이의 소중한 순간을 담은
        </p>
        <p className="text-base text-[#6B6B6B] mb-12 leading-relaxed">
          나만의 성장 앨범을 만들어보세요
        </p>

        <button
          onClick={handleStart}
          className="w-full max-w-xs mx-auto bg-[#2D6A4F] hover:bg-[#245A42] text-white text-base font-medium py-4 px-8 rounded-xl transition-colors duration-200 cursor-pointer"
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
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z" />
              </svg>
            ),
            title: '사진 업로드',
            desc: '소중한 사진을 선택하세요',
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
              </svg>
            ),
            title: '자동 꾸미기',
            desc: 'AI가 예쁘게 배치해줘요',
          },
          {
            icon: (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
              </svg>
            ),
            title: '앨범 주문',
            desc: '실물 앨범으로 받아보세요',
          },
        ].map((item) => (
          <div
            key={item.title}
            className="bg-white rounded-xl p-6 text-center border border-[#E5E5E3]"
          >
            <div className="w-10 h-10 rounded-lg bg-[#2D6A4F]/10 text-[#2D6A4F] flex items-center justify-center mx-auto mb-3">
              {item.icon}
            </div>
            <h3 className="font-semibold text-[#1A1A1A] text-sm mb-1">{item.title}</h3>
            <p className="text-xs text-[#6B6B6B]">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
