import { useNavigate } from 'react-router-dom'

export default function Privacy() {
  const navigate = useNavigate()

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
        <h2 className="text-base font-semibold text-[#1A1A1A]">개인정보처리방침</h2>
        <div className="w-5" />
      </header>

      <main className="flex-1 px-6 pb-16">
        <div className="max-w-lg mx-auto space-y-8">

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">1. 수집하는 개인정보 항목</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              Google 로그인 시 아래 정보가 수집됩니다.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#4A4A4A]">
              <li className="flex items-start gap-2">
                <span className="text-[#ACACAC] mt-1.5 w-1 h-1 rounded-full bg-[#ACACAC] flex-shrink-0" />
                <span>이름</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ACACAC] mt-1.5 w-1 h-1 rounded-full bg-[#ACACAC] flex-shrink-0" />
                <span>이메일 주소</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ACACAC] mt-1.5 w-1 h-1 rounded-full bg-[#ACACAC] flex-shrink-0" />
                <span>프로필 사진</span>
              </li>
            </ul>
            <p className="text-sm text-[#4A4A4A] leading-relaxed mt-2">
              주문 시 아래 정보가 추가로 수집됩니다.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-[#4A4A4A]">
              <li className="flex items-start gap-2">
                <span className="text-[#ACACAC] mt-1.5 w-1 h-1 rounded-full bg-[#ACACAC] flex-shrink-0" />
                <span>받는 사람 이름, 전화번호, 주소</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">2. 개인정보 수집 목적</h3>
            <ul className="space-y-1 text-sm text-[#4A4A4A]">
              <li className="flex items-start gap-2">
                <span className="text-[#ACACAC] mt-1.5 w-1 h-1 rounded-full bg-[#ACACAC] flex-shrink-0" />
                <span>서비스 제공 및 사용자 식별</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ACACAC] mt-1.5 w-1 h-1 rounded-full bg-[#ACACAC] flex-shrink-0" />
                <span>주문 관리 및 배송</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#ACACAC] mt-1.5 w-1 h-1 rounded-full bg-[#ACACAC] flex-shrink-0" />
                <span>고객 문의 응대</span>
              </li>
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">3. 개인정보 보유 기간</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              회원 탈퇴 시 즉시 파기합니다.
              단, 관련 법령에 의해 보존이 필요한 경우 해당 기간 동안 보관합니다.
              전자상거래법에 따라 계약 또는 청약철회에 관한 기록은 5년,
              대금결제 및 재화 등의 공급에 관한 기록은 5년간 보관합니다.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">4. 제3자 제공</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              앨범 제작 및 배송을 위해 아래 제3자에게 정보가 제공됩니다.
            </p>
            <div className="mt-2 bg-[#F7F7F5] rounded-lg p-3">
              <p className="text-xs font-semibold text-[#1A1A1A] mb-1">Sweetbook API</p>
              <p className="text-xs text-[#6B6B6B]">제공 항목: 받는 사람 이름, 전화번호, 주소</p>
              <p className="text-xs text-[#6B6B6B]">제공 목적: 앨범 제작 및 배송</p>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">5. 개인정보 파기 방법</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              전자적 파일 형태의 정보는 복구할 수 없는 방법으로 영구 삭제합니다.
              종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각하여 파기합니다.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">6. 이용자 권리</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있습니다.
              개인정보 처리에 대한 동의를 철회할 수 있으며,
              이 경우 서비스 이용이 제한될 수 있습니다.
              개인정보 관련 문의는 고객센터로 연락해주세요.
            </p>
          </section>

          <p className="text-xs text-[#ACACAC] pt-4">
            본 방침은 2025년 4월 1일부터 시행됩니다.
          </p>
        </div>
      </main>
    </div>
  )
}
