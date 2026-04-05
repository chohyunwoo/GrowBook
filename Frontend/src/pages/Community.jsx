import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { getPosts, createPost } from '../api/communityApi'
import { getReviews } from '../api/reviewApi'

const TYPE_FILTER_KEYS = ['', 'child', 'pet', 'travel', 'memory']
const SORT_KEYS = ['latest', 'popular']

const ITEMS_PER_PAGE = 10

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

export default function Community() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { state: appState } = useApp()
  const user = appState.user
  const [searchParams, setSearchParams] = useSearchParams()

  const [activeTab, setActiveTab] = useState('posts')

  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [typeFilter, setTypeFilter] = useState('')
  const [sort, setSort] = useState('latest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Write modal
  const [showWrite, setShowWrite] = useState(false)
  const [writeTitle, setWriteTitle] = useState('')
  const [writeContent, setWriteContent] = useState('')
  const [writeType, setWriteType] = useState('child')
  const [writeRating, setWriteRating] = useState(0)
  const [writeImages, setWriteImages] = useState([])
  const [writeSubmitting, setWriteSubmitting] = useState(false)

  // Reviews tab
  const [reviews, setReviews] = useState([])
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [reviewTypeFilter, setReviewTypeFilter] = useState('')
  const [reviewPage, setReviewPage] = useState(1)
  const [reviewTotalPages, setReviewTotalPages] = useState(1)
  const REVIEWS_PER_PAGE = 10
  const [avgRating, setAvgRating] = useState(0)

  // Auto-open write modal from query params
  useEffect(() => {
    if (searchParams.get('write') === 'true' && user) {
      const albumType = searchParams.get('albumType')
      if (albumType) setWriteType(albumType)
      setShowWrite(true)
      setSearchParams({}, { replace: true })
    }
  }, [user, searchParams])

  useEffect(() => {
    fetchPosts(1)
  }, [typeFilter, sort])

  useEffect(() => {
    if (location.state?.refresh) {
      fetchPosts(currentPage)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state])

  // Refetch on page re-entry (e.g. back from post detail)
  useEffect(() => {
    if (activeTab === 'posts') fetchPosts(currentPage)
  }, [location.key])

  // Fetch reviews when tab, filter, or page changes
  useEffect(() => {
    if (activeTab !== 'reviews') return
    fetchReviewList(reviewPage)
  }, [activeTab, reviewTypeFilter, reviewPage])

  // Reset review page when filter changes
  useEffect(() => {
    setReviewPage(1)
  }, [reviewTypeFilter])

  const fetchReviewList = async (page = 1) => {
    setReviewsLoading(true)
    try {
      const params = { page, limit: REVIEWS_PER_PAGE }
      if (reviewTypeFilter) params.type = reviewTypeFilter
      const res = await getReviews(params)
      const body = res.data?.data || res.data || {}
      const raw = Array.isArray(body) ? body : (body.items || body.reviews || [])
      setReviews(raw)
      const pages = (body.totalPages ?? body.total_pages ?? Math.ceil((body.totalCount ?? body.total_count ?? raw.length) / REVIEWS_PER_PAGE)) || 1
      setReviewTotalPages(pages)
      if (raw.length > 0) {
        const avg = body.avgRating ?? body.avg_rating
        if (avg != null) {
          setAvgRating(Math.round(avg * 10) / 10)
        } else {
          const sum = raw.reduce((acc, r) => acc + (r.rating ?? r.star ?? 0), 0)
          setAvgRating(Math.round((sum / raw.length) * 10) / 10)
        }
      } else {
        setAvgRating(0)
      }
    } catch {
      setReviews([])
      setAvgRating(0)
    }
    setReviewsLoading(false)
  }

  const fetchPosts = async (page) => {
    setLoading(true)
    try {
      const params = { page, limit: ITEMS_PER_PAGE, sort }
      if (typeFilter) params.type = typeFilter
      const res = await getPosts(params)
      const body = res.data?.data || res.data || {}
      const raw = Array.isArray(body) ? body : (body.items || body.posts || [])
      setPosts(raw)
      const pages = (body.totalPages ?? body.total_pages ?? Math.ceil((body.totalCount ?? body.total_count ?? raw.length) / ITEMS_PER_PAGE)) || 1
      setTotalPages(pages)
      setCurrentPage(page)
    } catch {
      setPosts([])
    }
    setLoading(false)
  }

  const handlePageChange = (page) => {
    fetchPosts(page)
  }

  const handleImageAdd = (e) => {
    const files = Array.from(e.target.files || [])
    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const valid = files.filter((f) => allowed.includes(f.type))
    const remaining = 5 - writeImages.length
    const toAdd = valid.slice(0, remaining).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }))
    setWriteImages((prev) => [...prev, ...toAdd])
    e.target.value = ''
  }

  const handleImageRemove = (index) => {
    setWriteImages((prev) => {
      URL.revokeObjectURL(prev[index].preview)
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleWrite = async () => {
    if (!writeTitle.trim()) return
    setWriteSubmitting(true)
    try {
      const accessToken = supabase
        ? (await supabase.auth.getSession())?.data?.session?.access_token
        : null
      await createPost(
        { title: writeTitle.trim(), content: writeContent.trim(), type: writeType, rating: writeRating || undefined },
        writeImages.map((img) => img.file),
        accessToken
      )
      writeImages.forEach((img) => URL.revokeObjectURL(img.preview))
      setShowWrite(false)
      setWriteTitle('')
      setWriteContent('')
      setWriteType('child')
      setWriteRating(0)
      setWriteImages([])
      fetchPosts(1)
    } catch { /* ignore */ }
    setWriteSubmitting(false)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="text-2xl font-bold text-primary">
          {t('brand')}
        </Link>
        <h2 className="text-base font-semibold text-[#1A1A1A]">커뮤니티</h2>
        <div className="w-16" />
      </header>

      <main className="flex-1 px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* Title */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-[#1A1A1A] mb-2">{t('community.title')}</h1>
            <p className="text-sm text-[#6B6B6B]">{t('community.subtitle')}</p>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-[#E5E5E3] mb-6">
            <button
              onClick={() => setActiveTab('posts')}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 cursor-pointer ${
                activeTab === 'posts'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              {t('community.gallery')}
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`flex-1 py-3 text-sm font-medium text-center transition-colors duration-200 cursor-pointer ${
                activeTab === 'reviews'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-[#6B6B6B] hover:text-[#1A1A1A]'
              }`}
            >
              {t('community.reviews')}
            </button>
          </div>

          {activeTab === 'posts' && (
          <>
          {/* Filters & Write */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            {TYPE_FILTER_KEYS.map((key) => (
              <button
                key={key}
                onClick={() => { setTypeFilter(key); setCurrentPage(1) }}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 cursor-pointer ${
                  typeFilter === key
                    ? 'bg-primary text-white'
                    : 'bg-white text-[#6B6B6B] border border-[#E5E5E3] hover:bg-[#F7F7F5]'
                }`}
              >
                {t(`community.${key || 'all'}`)}
              </button>
            ))}
            <div className="ml-auto flex items-center gap-2">
              {SORT_KEYS.map((key) => (
                <button
                  key={key}
                  onClick={() => { setSort(key); setCurrentPage(1) }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 cursor-pointer ${
                    sort === key
                      ? 'bg-[#1A1A1A] text-white'
                      : 'bg-white text-[#6B6B6B] border border-[#E5E5E3] hover:bg-[#F7F7F5]'
                  }`}
                >
                  {t(`community.${key}`)}
                </button>
              ))}
              {user && (
                <button
                  onClick={() => setShowWrite(true)}
                  className="px-4 py-1.5 bg-primary hover:bg-primary-dark text-white text-xs font-medium rounded-full transition-colors duration-200 cursor-pointer"
                >
                  {t('community.write')}
                </button>
              )}
            </div>
          </div>

          {/* Posts List */}
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-sm text-[#6B6B6B]">{t('community.noPost')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {posts.map((post) => {
                  const postId = post.id || post.postId || post.post_id
                  const likes = post.likes ?? post.likeCount ?? post.like_count ?? 0
                  const comments = post.comments ?? post.commentCount ?? post.comment_count ?? 0
                  const author = post.authorName || post.author_name || post.author || ''
                  const imgArr = parseImageUrls(post.image_urls, post.imageUrls, post.images)
                  const thumb = post.thumbnail || imgArr[0] || null
                  return (
                    <div
                      key={postId}
                      onClick={() => navigate(`/community/${postId}`)}
                      className="bg-white rounded-xl border border-[#E5E5E3] overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200"
                    >
                      {thumb ? (
                        <img
                          src={thumb}
                          alt={post.title || ''}
                          className="w-full aspect-square object-cover"
                          onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.className = 'hidden' }}
                        />
                      ) : (
                        <div className="w-full aspect-square bg-[#F0F0EE] flex items-center justify-center">
                          <span className="text-3xl text-[#ACACAC]">📷</span>
                        </div>
                      )}
                      <div className="p-3">
                        <p className="text-sm font-semibold text-[#1A1A1A] truncate">{post.title || '-'}</p>
                        <p className="text-xs text-[#ACACAC] truncate mt-0.5">{author}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-[#ACACAC]">
                          <span>❤️ {likes}</span>
                          <span>💬 {comments}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1 mt-6">
                  <button
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                      currentPage === 1
                        ? 'text-[#D1D1CF] cursor-not-allowed'
                        : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'
                    }`}
                  >
                    &lt;
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                        page === currentPage
                          ? 'bg-primary text-white'
                          : 'bg-white text-[#6B6B6B] border border-[#E5E5E3] hover:bg-[#F7F7F5]'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                      currentPage === totalPages
                        ? 'text-[#D1D1CF] cursor-not-allowed'
                        : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'
                    }`}
                  >
                    &gt;
                  </button>
                </div>
              )}
            </>
          )}
          </>
          )}

          {/* Reviews Tab */}
          {activeTab === 'reviews' && (
            <div>
              {/* Average Rating */}
              {!reviewsLoading && reviews.length > 0 && (
                <div className="bg-white rounded-xl border border-[#E5E5E3] p-5 mb-6 text-center">
                  <p className="text-xs font-semibold text-[#6B6B6B] uppercase tracking-wider mb-2">{t('community.rating')}</p>
                  <p className="text-3xl font-bold text-yellow-500">⭐ {avgRating} <span className="text-lg text-[#ACACAC] font-normal">/ 5.0</span></p>
                  <p className="text-xs text-[#ACACAC] mt-1">{reviews.length} {t('community.reviews')}</p>
                </div>
              )}

              {/* Review Type Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                {TYPE_FILTER_KEYS.map((key) => (
                  <button
                    key={key}
                    onClick={() => setReviewTypeFilter(key)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors duration-200 cursor-pointer ${
                      reviewTypeFilter === key
                        ? 'bg-primary text-white'
                        : 'bg-white text-[#6B6B6B] border border-[#E5E5E3] hover:bg-[#F7F7F5]'
                    }`}
                  >
                    {t(`community.${key || 'all'}`)}
                  </button>
                ))}
              </div>

              {/* Review List */}
              {reviewsLoading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : reviews.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-sm text-[#6B6B6B]">{t('community.noReview')}</p>
                </div>
              ) : (
                <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {reviews.map((review, index) => {
                    const rRating = review.rating ?? review.star ?? 0
                    const rAuthor = review.authorName || review.author_name || review.author || ''
                    const rImgArr = parseImageUrls(review.image_urls, review.imageUrls, review.images)
                    const rThumb = rImgArr[0] || null
                    return (
                      <div key={review.id || index} onClick={() => navigate(`/community/review/${review.id || review.reviewId || review.review_id}`)} className="bg-white rounded-xl border border-[#E5E5E3] overflow-hidden cursor-pointer shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-200">
                        {rThumb ? (
                          <img
                            src={rThumb}
                            alt=""
                            className="w-full aspect-square object-cover"
                            onError={(e) => { e.target.onerror = null; e.target.src = ''; e.target.className = 'hidden' }}
                          />
                        ) : (
                          <div className="w-full aspect-square bg-[#F0F0EE] flex items-center justify-center">
                            <span className="text-3xl text-[#ACACAC]">⭐</span>
                          </div>
                        )}
                        <div className="p-3">
                          {rRating > 0 && (
                            <p className="text-xs text-yellow-500 mb-1">
                              {'★'.repeat(rRating)}{'☆'.repeat(5 - rRating)}
                            </p>
                          )}
                          {review.content && (
                            <p className="text-sm font-semibold text-[#1A1A1A] truncate">{review.content}</p>
                          )}
                          <p className="text-xs text-[#ACACAC] truncate mt-0.5">{rAuthor}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
                {/* Review Pagination */}
                {reviewTotalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-6">
                    <button
                      onClick={() => setReviewPage((p) => Math.max(1, p - 1))}
                      disabled={reviewPage === 1}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                        reviewPage === 1
                          ? 'text-[#D1D1CF] cursor-not-allowed'
                          : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'
                      }`}
                    >
                      &lt;
                    </button>
                    {Array.from({ length: reviewTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setReviewPage(page)}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer ${
                          page === reviewPage
                            ? 'bg-primary text-white'
                            : 'bg-white text-[#6B6B6B] border border-[#E5E5E3] hover:bg-[#F7F7F5]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setReviewPage((p) => Math.min(reviewTotalPages, p + 1))}
                      disabled={reviewPage === reviewTotalPages}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 ${
                        reviewPage === reviewTotalPages
                          ? 'text-[#D1D1CF] cursor-not-allowed'
                          : 'text-[#6B6B6B] hover:bg-[#F0F0EE] cursor-pointer'
                      }`}
                    >
                      &gt;
                    </button>
                  </div>
                )}
                </>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Write Modal */}
      {showWrite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-[#1A1A1A] mb-4">{t('community.writePost')}</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">제목</label>
                <input
                  type="text"
                  value={writeTitle}
                  onChange={(e) => setWriteTitle(e.target.value)}
                  placeholder={t('community.title_placeholder')}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">포토북 타입</label>
                <select
                  value={writeType}
                  onChange={(e) => setWriteType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] focus:outline-none focus:border-primary transition-colors duration-200 bg-white"
                >
                  {TYPE_FILTER_KEYS.filter((k) => k).map((key) => (
                    <option key={key} value={key}>{t(`community.${key}`)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">{t('community.rating')}</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setWriteRating(writeRating === star ? 0 : star)}
                      className="text-2xl cursor-pointer transition-transform duration-150 hover:scale-110"
                    >
                      {star <= writeRating ? '\u2B50' : '\u2606'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">내용</label>
                <textarea
                  value={writeContent}
                  onChange={(e) => setWriteContent(e.target.value)}
                  placeholder={t('community.content_placeholder')}
                  rows={5}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#6B6B6B] mb-1">사진 (최대 5장)</label>
                {writeImages.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {writeImages.map((img, i) => (
                      <div key={i} className="relative w-16 h-16">
                        <img src={img.preview} alt="" className="w-16 h-16 rounded-lg object-cover border border-[#E5E5E3]" />
                        <button
                          onClick={() => handleImageRemove(i)}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold cursor-pointer hover:bg-red-600 transition-colors duration-200"
                        >
                          X
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {writeImages.length < 5 && (
                  <label className="inline-flex items-center gap-1.5 px-3 py-2 border border-dashed border-[#E5E5E3] hover:border-primary rounded-lg text-xs text-[#6B6B6B] hover:text-primary cursor-pointer transition-colors duration-200">
                    <span>📷 사진 추가</span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      multiple
                      onChange={handleImageAdd}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>
            <button
              onClick={handleWrite}
              disabled={writeSubmitting || !writeTitle.trim()}
              className={`w-full text-white text-sm font-medium py-3 rounded-xl transition-colors duration-200 mb-3 ${
                writeSubmitting || !writeTitle.trim()
                  ? 'bg-[#D1D1CF] cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark cursor-pointer'
              }`}
            >
              {writeSubmitting ? '...' : t('community.submit')}
            </button>
            <button
              onClick={() => setShowWrite(false)}
              className="w-full text-center text-sm text-[#6B6B6B] hover:text-[#1A1A1A] font-medium py-2 cursor-pointer transition-colors duration-200"
            >
              {t('community.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
