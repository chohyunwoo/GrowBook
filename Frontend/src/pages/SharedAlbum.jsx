import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSharedAlbum } from '../api/shareApi'

const TYPE_LABELS = {
  child: '아이 성장',
  pet: '반려동물',
  travel: '여행',
  memory: '추억',
}

export default function SharedAlbum() {
  const { t } = useTranslation()
  const { shareCode } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expired, setExpired] = useState(false)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getSharedAlbum(shareCode)
        const raw = res.data?.data || res.data
        setData(raw)
      } catch (err) {
        if (err.response?.status === 404 || err.response?.status === 410) {
          setExpired(true)
        } else {
          setExpired(true)
        }
      }
      setLoading(false)
    }
    fetch()
  }, [shareCode])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (expired) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="text-center max-w-md w-full">
          <div className="w-16 h-16 bg-[#F0F0EE] rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-7 h-7 text-[#ACACAC]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">공유 링크 만료</h1>
          <p className="text-sm text-[#6B6B6B] mb-8">이 포토북 공유 링크는 만료되었어요</p>
          <Link
            to="/"
            className="inline-block bg-primary hover:bg-primary-dark text-white text-sm font-medium py-3 px-8 rounded-xl transition-colors duration-200"
          >
            {t('complete.goHome', '홈으로')}
          </Link>
        </div>
      </div>
    )
  }

  const title = data?.title || '-'
  const subtitle = data?.subtitle || ''
  const story = data?.story || ''
  const type = data?.type || ''
  const expiresAt = data?.expiresAt || data?.expires_at

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center px-6 py-4 border-b border-[#E5E5E3]">
        <Link to="/" className="text-2xl font-bold text-primary">
          {t('brand')}
        </Link>
      </header>

      <main className="flex-1 px-4 py-8 pb-16">
        <div className="max-w-lg mx-auto">
          {/* Type Badge */}
          {type && (
            <div className="flex justify-center mb-6">
              <span className="inline-block px-3 py-1 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                {TYPE_LABELS[type] || type}
              </span>
            </div>
          )}

          {/* Title */}
          <h1 className="text-3xl font-bold text-[#1A1A1A] text-center mb-2">{title}</h1>

          {/* Subtitle */}
          {subtitle && (
            <p className="text-base text-[#6B6B6B] text-center mb-8">{subtitle}</p>
          )}

          {/* Story */}
          {story && (
            <div className="bg-white rounded-xl border border-[#E5E5E3] p-6 mb-6">
              <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-3">AI Story</p>
              <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-line">{story}</p>
            </div>
          )}

          {/* Expiry */}
          {expiresAt && (
            <p className="text-xs text-[#ACACAC] text-center">
              {new Date(expiresAt).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}까지 유효
            </p>
          )}
        </div>
      </main>
    </div>
  )
}
