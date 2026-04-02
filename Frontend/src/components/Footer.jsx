import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="border-t border-[#E5E5E3] bg-white px-6 py-8">
      <div className="max-w-2xl mx-auto">
        <p className="text-sm font-bold text-primary mb-3">GrowBook</p>
        <div className="flex items-center gap-4 mb-4">
          <Link
            to="/terms"
            className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200"
          >
            이용약관
          </Link>
          <span className="text-[#E5E5E3]">|</span>
          <Link
            to="/privacy"
            className="text-xs text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200"
          >
            개인정보처리방침
          </Link>
        </div>
        <p className="text-xs text-[#ACACAC]">
          고객센터: support@growbook.kr
        </p>
      </div>
    </footer>
  )
}
