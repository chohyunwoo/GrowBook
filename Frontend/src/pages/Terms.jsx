import { useNavigate } from 'react-router-dom'

export default function Terms() {
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
        <h2 className="text-base font-semibold text-[#1A1A1A]">이용약관</h2>
        <div className="w-5" />
      </header>

      <main className="flex-1 px-6 pb-16">
        <div className="max-w-lg mx-auto space-y-8">

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">1. 서비스 소개</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              GrowBook은 AI를 활용하여 사용자의 소중한 순간을 한 권의 실물 앨범으로 제작하는 서비스입니다.
              아이 성장, 반려동물, 여행, 추억 등 다양한 주제의 앨범을 제작할 수 있습니다.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">2. 서비스 이용 조건</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              본 서비스를 이용하려면 Google 계정으로 로그인해야 합니다.
              이용자는 서비스 이용 시 관련 법령과 본 약관을 준수해야 하며,
              타인의 권리를 침해하는 콘텐츠를 업로드해서는 안 됩니다.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">3. 주문 및 결제</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              앨범 주문은 충전금(크레딧) 차감 방식으로 결제됩니다.
              주문 시 제작비, 배송비가 포함된 총 금액이 충전금에서 차감됩니다.
              충전금이 부족한 경우 파트너 포털에서 충전 후 주문할 수 있습니다.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">4. 취소 및 환불 정책</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              주문 취소는 결제 완료(PAID) 또는 제작 준비 완료(PDF_READY) 상태에서만 가능합니다.
              제작이 시작된 이후에는 취소가 불가합니다.
              취소가 완료되면 차감된 충전금이 즉시 환불됩니다.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">5. 개인정보 수집</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              서비스 이용 과정에서 이용자의 개인정보가 수집될 수 있으며,
              자세한 내용은 개인정보처리방침에서 확인할 수 있습니다.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">6. 면책 조항</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              AI가 생성한 스토리 및 캡션의 내용에 대해 서비스 제공자는 책임을 지지 않습니다.
              사용자가 업로드한 이미지 및 텍스트의 저작권은 사용자에게 있으며,
              서비스 제공자는 이에 대한 책임을 지지 않습니다.
              천재지변, 시스템 장애 등 불가항력적 사유로 인한 서비스 중단에 대해 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h3 className="text-sm font-bold text-[#1A1A1A] mb-2">7. 분쟁 해결</h3>
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              본 약관과 관련하여 분쟁이 발생한 경우, 양 당사자는 원만한 해결을 위해 성실히 협의합니다.
              협의가 이루어지지 않는 경우 관할 법원에 소를 제기할 수 있습니다.
            </p>
          </section>

          <p className="text-xs text-[#ACACAC] pt-4">
            본 약관은 2025년 4월 1일부터 시행됩니다.
          </p>
        </div>
      </main>
    </div>
  )
}
