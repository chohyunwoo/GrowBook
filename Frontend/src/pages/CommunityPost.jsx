import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useApp } from '../context/AppContext'
import { supabase } from '../lib/supabase'
import { getPost, deletePost, togglePostLike, getComments, createComment, deleteComment } from '../api/communityApi'

const TYPE_LABELS = {
  child: '아이 성장',
  pet: '반려동물',
  travel: '여행',
  memory: '추억',
}

export default function CommunityPost() {
  const { t } = useTranslation()
  const { postId } = useParams()
  const navigate = useNavigate()
  const { state } = useApp()
  const user = state.user

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [loginAlert, setLoginAlert] = useState(false)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [isLiking, setIsLiking] = useState(false)

  const getAccessToken = async () => {
    if (!supabase) return null
    const { data } = await supabase.auth.getSession()
    return data?.session?.access_token || null
  }

  const postImages = post?.image_urls || post?.imageUrls || post?.images || []

  const openLightbox = (index) => {
    setLightboxIndex(index)
    setLightboxOpen(true)
  }

  const closeLightbox = () => setLightboxOpen(false)

  const lightboxPrev = useCallback(() => {
    setLightboxIndex((i) => (i <= 0 ? postImages.length - 1 : i - 1))
  }, [postImages.length])

  const lightboxNext = useCallback(() => {
    setLightboxIndex((i) => (i >= postImages.length - 1 ? 0 : i + 1))
  }, [postImages.length])

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

  useEffect(() => {
    fetchPost()
    fetchComments()
  }, [postId])

  const fetchPost = async () => {
    setLoading(true)
    try {
      const res = await getPost(postId)
      setPost(res.data?.data || res.data)
    } catch {
      setPost(null)
    }
    setLoading(false)
  }

  const fetchComments = async () => {
    setCommentsLoading(true)
    try {
      const res = await getComments(postId)
      const raw = res.data?.data || res.data || []
      setComments(Array.isArray(raw) ? raw : (raw.items || raw.comments || []))
    } catch {
      setComments([])
    }
    setCommentsLoading(false)
  }

  const handleLike = async () => {
    if (!user) {
      setLoginAlert(true)
      setTimeout(() => setLoginAlert(false), 2000)
      return
    }
    if (isLiking) return
    setIsLiking(true)
    const prevLiked = post.liked
    const prevLikes = post.likes ?? post.likeCount ?? post.like_count ?? 0
    // Optimistic
    setPost((prev) => prev ? {
      ...prev,
      liked: !prevLiked,
      likes: prevLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1,
    } : prev)
    try {
      const token = await getAccessToken()
      const res = await togglePostLike(postId, token)
      const updated = res.data?.data || res.data
      // Server truth
      setPost((prev) => prev ? {
        ...prev,
        liked: updated?.liked ?? !prevLiked,
        likes: updated?.likes ?? updated?.likeCount ?? updated?.like_count ?? (prevLiked ? Math.max(0, prevLikes - 1) : prevLikes + 1),
      } : prev)
    } catch {
      // Rollback
      setPost((prev) => prev ? { ...prev, liked: prevLiked, likes: prevLikes } : prev)
    }
    setIsLiking(false)
  }

  const handleDelete = async () => {
    if (!window.confirm('게시글을 삭제할까요?')) return
    setDeleting(true)
    try {
      const token = await getAccessToken()
      await deletePost(postId, token)
      navigate('/community', { replace: true, state: { refresh: true } })
    } catch { /* ignore */ }
    setDeleting(false)
  }

  const handleCommentSubmit = async () => {
    if (!commentText.trim()) return
    setCommentSubmitting(true)
    try {
      const token = await getAccessToken()
      await createComment(postId, { content: commentText.trim() }, token)
      setCommentText('')
      await fetchComments()
    } catch { /* ignore */ }
    setCommentSubmitting(false)
  }

  const handleCommentDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제할까요?')) return
    try {
      const token = await getAccessToken()
      await deleteComment(postId, commentId, token)
      await fetchComments()
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <p className="text-sm text-[#6B6B6B] mb-4">{t('community.noPost')}</p>
        <Link to="/community" className="text-sm text-primary hover:text-primary-dark font-medium transition-colors duration-200">
          {t('community.backToList')}
        </Link>
      </div>
    )
  }

  const type = post.type || post.album_type
  const rating = post.rating ?? post.star ?? 0
  const likes = post.likes ?? post.likeCount ?? post.like_count ?? 0
  const author = post.authorName || post.author_name || post.author || ''
  const authorId = post.authorId || post.author_id || post.userId || post.user_id
  const date = post.createdAt || post.created_at
  const isOwner = user && authorId && (user.id === authorId)

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <button
          onClick={() => navigate('/community', { state: { refresh: true } })}
          className="text-[#6B6B6B] hover:text-[#1A1A1A] transition-colors duration-200 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h2 className="text-base font-semibold text-[#1A1A1A]">{t('community.gallery')}</h2>
        <div className="w-5" />
      </header>

      <main className="flex-1 px-4 pb-16">
        <div className="max-w-2xl mx-auto">
          {/* Post */}
          <div className="bg-white rounded-xl border border-[#E5E5E3] p-6 mb-6">
            <h1 className="text-xl font-bold text-[#1A1A1A] mb-2">{post.title || '-'}</h1>
            <div className="flex items-center gap-2 mb-4">
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
            <div className="flex items-center gap-3 text-xs text-[#ACACAC] mb-6">
              <span className="font-medium text-[#6B6B6B]">{author}</span>
              {date && <span>{new Date(date).toLocaleDateString('ko-KR')}</span>}
            </div>

            {postImages.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {postImages.map((src, i) => (
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

            {post.content && (
              <p className="text-sm text-[#1A1A1A] leading-relaxed whitespace-pre-line mb-6">{post.content}</p>
            )}

            <div className="flex items-center justify-between pt-4 border-t border-[#F0F0EE]">
              <button
                onClick={(isOwner || isLiking) ? undefined : handleLike}
                disabled={isOwner || isLiking}
                title={isOwner ? '자신의 게시글에는 좋아요를 누를 수 없어요' : undefined}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors duration-200 ${
                  isOwner || isLiking
                    ? 'text-gray-300 cursor-not-allowed'
                    : post.liked
                    ? 'text-red-500 cursor-pointer'
                    : 'text-[#ACACAC] hover:text-red-400 cursor-pointer'
                }`}
              >
                <span>{post.liked ? '\u2764\uFE0F' : '\uD83E\uDD0D'}</span>
                <span>{likes}</span>
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

          {/* Comments */}
          <div className="bg-white rounded-xl border border-[#E5E5E3] p-6">
            <h3 className="text-sm font-semibold text-[#1A1A1A] mb-4">{t('community.comment')} {comments.length > 0 && `(${comments.length})`}</h3>

            {/* Comment Input */}
            {user ? (
              <div className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={t('community.content_placeholder')}
                  rows={2}
                  className="w-full px-3 py-2.5 rounded-lg border border-[#E5E5E3] text-sm text-[#1A1A1A] placeholder-[#ACACAC] focus:outline-none focus:border-primary transition-colors duration-200 resize-none mb-2"
                />
                <div className="flex justify-end">
                  <button
                    onClick={handleCommentSubmit}
                    disabled={commentSubmitting || !commentText.trim()}
                    className={`px-4 py-2 text-xs font-medium rounded-lg transition-colors duration-200 ${
                      commentSubmitting || !commentText.trim()
                        ? 'bg-[#D1D1CF] text-white cursor-not-allowed'
                        : 'bg-primary hover:bg-primary-dark text-white cursor-pointer'
                    }`}
                  >
                    {commentSubmitting ? '...' : t('community.submit')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#ACACAC] mb-6">{t('nav.login')}</p>
            )}

            {/* Comments List */}
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            ) : comments.length === 0 ? (
              <p className="text-xs text-[#ACACAC] text-center py-6">{t('community.noPost')}</p>
            ) : (
              <div className="space-y-4">
                {comments.map((c) => {
                  const cId = c.id || c.commentId || c.comment_id
                  const cAuthor = c.authorName || c.author_name || c.author || ''
                  const cAuthorId = c.authorId || c.author_id || c.userId || c.user_id
                  const cDate = c.createdAt || c.created_at
                  const cIsOwner = user && cAuthorId && (user.id === cAuthorId)
                  return (
                    <div key={cId} className="border-b border-[#F0F0EE] pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-[#1A1A1A]">{cAuthor}</span>
                          {cDate && <span className="text-[10px] text-[#ACACAC]">{new Date(cDate).toLocaleDateString('ko-KR')}</span>}
                        </div>
                        {cIsOwner && (
                          <button
                            onClick={() => handleCommentDelete(cId)}
                            className="text-[10px] text-red-500 hover:text-red-600 font-medium cursor-pointer transition-colors duration-200"
                          >
                            삭제
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-[#1A1A1A]">{c.content || ''}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Image Lightbox */}
      {lightboxOpen && postImages.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={closeLightbox}
        >
          {/* Close */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg cursor-pointer transition-colors duration-200"
          >
            ✕
          </button>

          {/* Prev */}
          {postImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); lightboxPrev() }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg cursor-pointer transition-colors duration-200"
            >
              ‹
            </button>
          )}

          {/* Image */}
          <img
            src={postImages[lightboxIndex]}
            alt=""
            className="max-w-[90vw] max-h-[80vh] rounded-xl object-contain transition-opacity duration-300"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Next */}
          {postImages.length > 1 && (
            <button
              onClick={(e) => { e.stopPropagation(); lightboxNext() }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg cursor-pointer transition-colors duration-200"
            >
              ›
            </button>
          )}

          {/* Counter */}
          {postImages.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full">
              {lightboxIndex + 1} / {postImages.length}
            </div>
          )}
        </div>
      )}

      {/* Login Alert */}
      {loginAlert && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#1A1A1A] text-white text-sm font-medium px-5 py-3 rounded-xl shadow-lg">
          {t('nav.login')}
        </div>
      )}
    </div>
  )
}
