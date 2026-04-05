import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { getReviewDetail, deleteReview } from '../api/reviewApi'

const TYPE_LABELS = {
  child: '아이 성장',
  pet: '반려동물',
  travel: '여행',
  memory: '추억',
}

function parseImageUrls(...sources) {
  for (const src of sources) {
    if (!src) continue
    if (Array.isArray(src)) return src
    if (typeof src === 'string') {
      try { const parsed = JSON.parse(src); if (Array.isArray(parsed)) return parsed } catch { /* ignore */ }
    }
  }
  return []
}

export default function ReviewPost() {
  const { t } = useTranslation()
  const { reviewId } = useParams()
  const navigate = useNavigate()
  const { state } = useApp()
  const user = state.user

  const [review, setReview] = useState(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getReviewDetail(reviewId)
        setReview(res.data?.data || res.data)
      } catch {
        setReview(null)
      }
      setLoading(false)
    }
    fetch()
  }, [reviewId])

  const images = review ? parseImageUrls(review.image_urls, review.imageUrls, review.images) : []

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }
  const closeLightbox = () => setLightboxOpen(false)

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((i) => (i <= 0 ? images.length - 1 : i - 1))
  }, [images.length])

  const lightboxNext = useCallback(() => {
    setLightboxIndex((i) => (i >= images.length - 1 ? 0 : i + 1))
  }, [images.length])

  useEffect(() => {
    if (!lightboxOpen) return
    const handleKey = (e) => {
      if (e.key === 'Escape') closeLightbox()
      else if (e.key === 'ArrowLeft') lightboxPrev()
      else if (e.key === 'ArrowRight') lightboxNext()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [lightboxOpen, lightboxPrev, lightboxNext])

  const handleDelete = async () => {
    if (!window.confirm('리뷰를 삭제할까요?')) return
    setDeleting(true)
    try {
      const accessToken = supabase
        ? (await supabase.auth.getSession())?.data?.session?.access_token
        : null
      await deleteReview(reviewId, accessToken)
      navigate('/community', { replace: true, state: { refresh: true } })
    } catch { /* ignore */ }
    setDeleting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!review) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <p className="text-sm text-[#6B6B6B] mb-4">{t('community.noReview')}</p>
        <Link to="/community" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200">
          {t('community.backToList')}
        </Link>
      </div>
    )
  }

  const type = review.type || review.album_type || review.albumType
  const rating = review.rating ?? review.star ?? 0
  const author = review.authorName || review.author_name || review.author || ''
  const authorId = review.authorId || review.author_id || review.userId || review.user_id
  const date = review.createdAt || review.created_at
  const isOwner = user && authorId && (user.id === authorId)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/community')}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-[#1A1A1A]">{t('community.reviews')}</h2>
        <div className="w-5" />
      </header>

      <main className="flex-1 px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl border border-[#E5E5E3] p-6">
            {/* Type + Rating */}
            <div className="flex items-center gap-2 mb-3">
              {type && (
                <span className="inline-block px-2.5 py-0.5 bg-primary/10 text-primary text-xs font-semibold rounded-full">
                  {TYPE_LABELS[type] || type}
                </span>
              )}
              {rating > 0 && (
                <span className="text-sm text-yellow-500">
                  {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
                </span>
              )}
            </div>

            {/* Author + Date */}
            <div className="flex items-center gap-3 text-xs text-[#ACACAC] mb-6">
              <span className="font-medium text-[#6B6B6B]">{author}</span>
              {date && <span>{new Date(date).toLocaleDateString('ko-KR')}</span>}
            </div>

            {/* Images */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {images.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt=""
                    onClick={() => openLightbox(i)}
                    className="w-24 h-24 rounded-lg object-cover border border-[#E5E5E3] cursor-pointer hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </div>
            )}

            {/* Content */}
            {review.content && (
              <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-line mb-6">{review.content}</p>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-[#F0F0EE]">
              <button
                onClick={() => navigate('/community')}
                className="text-xs font-medium text-primary hover:text-primary-dark cursor-pointer transition-colors duration-200"
              >
                {t('community.backToList')}
              </button>
              {isOwner && (
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className={`text-xs font-medium transition-colors duration-200 ${
                    deleting ? 'text-[#ACACAC] cursor-not-allowed' : 'text-red-500 hover:text-red-600 cursor-pointer'
                  }`}
                >
                  {deleting ? '...' : t('community.delete')}
                </button>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Lightbox */}
      {lightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg cursor-pointer transition-colors duration-200"
          >
            ✕
          </button>
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); lightboxPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg cursor-pointer transition-colors duration-200"
            >
              ‹
            </button>
          )}
          <img
            src={images[lightboxIndex]}
            alt=""
            className="max-w-[90vw] max-h-[80vh] rounded-xl object-contain transition-opacity duration-300"
            onClick={(e) => e.stopPropagation()}
          />
          {images.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); lightboxNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg cursor-pointer transition-colors duration-200"
            >
              ›
            </button>
          )}
          {images.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full">
              {lightboxIndex + 1} / {images.length}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
