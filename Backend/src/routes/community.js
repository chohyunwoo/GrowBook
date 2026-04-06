const express = require('express')
const multer = require('multer')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')
const { supabase } = require('../services/supabaseService')

const router = express.Router()

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(Object.assign(new Error('허용되지 않는 파일 형식입니다.'), { code: 'FILE_TYPE_NOT_ALLOWED' }))
    }
  },
})

// ── 인증 헬퍼 ───────────────────────────────────────────────────
async function getAuthUser(req) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return null
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// ── 1. 게시글 목록 조회 ─────────────────────────────────────────
/**
 * @swagger
 * /api/community:
 *   get:
 *     summary: 게시글 목록 조회
 *     tags: [Community]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, popular]
 *           default: latest
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: 게시글 목록 조회 성공
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { type, sort } = req.query
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10))
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('community_posts')
      .select('id, title, album_type, author_name, rating, likes, image_urls, created_at', { count: 'exact' })

    if (type) {
      query = query.eq('album_type', type)
    }

    if (sort === 'popular') {
      query = query.order('likes', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query.range(from, to)

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '게시글 목록 조회 중 오류가 발생했습니다.' })
    }

    // 댓글 수 별도 집계
    const postIds = data.map((p) => p.id)
    let commentCounts = {}
    if (postIds.length > 0) {
      const { data: comments } = await supabase
        .from('community_comments')
        .select('post_id')
        .in('post_id', postIds)

      if (comments) {
        for (const c of comments) {
          commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1
        }
      }
    }

    const postsWithCommentCount = data.map((post) => ({
      ...post,
      comment_count: commentCounts[post.id] || 0,
    }))

    res.json({
      success: true,
      data: postsWithCommentCount,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
    })
  })
)

// ── 3. 게시글 작성 (목록 GET / 보다 뒤, 상세 /:postId 보다 앞) ──
/**
 * @swagger
 * /api/community:
 *   post:
 *     summary: 게시글 작성
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, content]
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               albumType:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               orderUid:
 *                 type: string
 *     responses:
 *       200:
 *         description: 게시글 작성 성공
 */
router.post(
  '/',
  (req, res, next) => {
    upload.fields([
        { name: 'image_0', maxCount: 1 },
        { name: 'image_1', maxCount: 1 },
        { name: 'image_2', maxCount: 1 },
        { name: 'image_3', maxCount: 1 },
        { name: 'image_4', maxCount: 1 },
      ])(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'FILE_TYPE_NOT_ALLOWED') {
        return res.status(400).json({ success: false, error: ERROR_CODE.FILE_TYPE_NOT_ALLOWED, message: '허용되지 않는 파일 형식입니다. (jpg, png, webp만 허용)' })
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: ERROR_CODE.FILE_SIZE_EXCEEDED, message: '파일 크기가 5MB를 초과합니다.' })
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '이미지는 최대 5장까지 첨부할 수 있습니다.' })
      }
      next(err)
    })
  },
  asyncHandler(async (req, res) => {
    const user = await getAuthUser(req)
    if (!user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
    }

    // 개별 필드 방식 우선, req.body.data JSON 방식은 폴백
    let title, content, albumType, rating, orderUid
    if (req.body.title) {
      title = req.body.title
      content = req.body.content
      albumType = req.body.albumType || req.body.type
      rating = req.body.rating ? Number(req.body.rating) : undefined
      orderUid = req.body.orderUid
    } else if (req.body.data) {
      let parsed
      try {
        parsed = JSON.parse(req.body.data)
      } catch (e) {
        return res.status(400).json({ success: false, error: 'INVALID_JSON', message: '잘못된 JSON 형식입니다.' })
      }
      ;({ title, content, albumType, rating, orderUid } = parsed)
    }

    if (!title || !content) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '제목과 내용은 필수입니다.' })
    }
    if (rating !== undefined && (!Number.isInteger(rating) || rating < 1 || rating > 5)) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'rating은 1~5 사이의 정수여야 합니다.' })
    }

    // 이미지 업로드 (Supabase Storage)
    const imageFiles = Object.values(req.files || {}).flat().filter((f) => f.mimetype.startsWith('image/'))
    if (imageFiles.length > 5) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '이미지는 최대 5장까지 첨부할 수 있습니다.' })
    }
    const imageUrls = []
    if (imageFiles.length) {
      for (let index = 0; index < imageFiles.length; index++) {
        const file = imageFiles[index]
        const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase()
        const safeFileName = `${Date.now()}_${index}.${ext}`
        const filePath = `posts/${user.id}/${safeFileName}`
        const { error: uploadError } = await supabase.storage
          .from('community-images')
          .upload(filePath, file.buffer, { contentType: file.mimetype })

        if (uploadError) {
          console.error('[community POST] Storage 에러:', uploadError)
        }
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('community-images')
            .getPublicUrl(filePath)
          imageUrls.push(urlData.publicUrl)
        }
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    const insertData = {
      user_id: user.id,
      author_name: profile?.name || '익명',
      title,
      content,
      album_type: albumType || null,
      rating: rating || null,
      order_uid: orderUid || null,
      image_urls: imageUrls.length > 0 ? imageUrls : null,
    }

    const { data, error } = await supabase
      .from('community_posts')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[community POST] DB 저장 에러:', error)
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '게시글 작성 중 오류가 발생했습니다.' })
    }

    res.json({ success: true, data })
  })
)

// ── 7. 좋아요 토글 (/:postId 보다 앞에 배치 불필요 — /like 서픽스) ─
/**
 * @swagger
 * /api/community/{postId}/like:
 *   post:
 *     summary: 좋아요 토글
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 좋아요 토글 성공
 */
router.post(
  '/:postId/like',
  asyncHandler(async (req, res) => {
    const user = await getAuthUser(req)
    if (!user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
    }

    const { postId } = req.params

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, user_id, likes')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' })
    }

    if (post.user_id === user.id) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '자신의 게시글에는 좋아요를 누를 수 없어요' })
    }

    const { data: existingLike } = await supabase
      .from('community_post_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .single()

    let liked
    let newLikes

    if (existingLike) {
      await supabase.from('community_post_likes').delete().eq('id', existingLike.id)
      newLikes = Math.max(0, (post.likes || 0) - 1)
      liked = false
    } else {
      await supabase.from('community_post_likes').insert({ post_id: postId, user_id: user.id })
      newLikes = (post.likes || 0) + 1
      liked = true
    }

    await supabase.from('community_posts').update({ likes: newLikes }).eq('id', postId)

    res.json({ success: true, data: { liked, likes: newLikes } })
  })
)

// ── 댓글 목록 조회 ──────────────────────────────────────────────
/**
 * @swagger
 * /api/community/{postId}/comments:
 *   get:
 *     summary: 댓글 목록 조회
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 댓글 목록 조회 성공
 */
router.get(
  '/:postId/comments',
  asyncHandler(async (req, res) => {
    const { postId } = req.params

    const { data, error } = await supabase
      .from('community_comments')
      .select('id, user_id, author_name, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '댓글 조회 중 오류가 발생했습니다.' })
    }

    res.json({ success: true, data })
  })
)

// ── 5. 댓글 작성 ────────────────────────────────────────────────
/**
 * @swagger
 * /api/community/{postId}/comments:
 *   post:
 *     summary: 댓글 작성
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 댓글 작성 성공
 */
router.post(
  '/:postId/comments',
  asyncHandler(async (req, res) => {
    const user = await getAuthUser(req)
    if (!user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
    }

    const { postId } = req.params
    const { content } = req.body

    if (!content) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '댓글 내용은 필수입니다.' })
    }

    // 게시글 존재 확인
    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, comment_count')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        author_name: profile?.name || '익명',
        content,
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '댓글 작성 중 오류가 발생했습니다.' })
    }

    await supabase.from('community_posts').update({ comment_count: (post.comment_count || 0) + 1 }).eq('id', postId)

    res.json({ success: true, data })
  })
)

// ── 6. 댓글 삭제 ────────────────────────────────────────────────
/**
 * @swagger
 * /api/community/{postId}/comments/{commentId}:
 *   delete:
 *     summary: 댓글 삭제
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 댓글 삭제 성공
 */
router.delete(
  '/:postId/comments/:commentId',
  asyncHandler(async (req, res) => {
    const user = await getAuthUser(req)
    if (!user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
    }

    const { postId, commentId } = req.params

    const { data: comment, error: commentError } = await supabase
      .from('community_comments')
      .select('id, user_id')
      .eq('id', commentId)
      .eq('post_id', postId)
      .single()

    if (commentError || !comment) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '댓글을 찾을 수 없습니다.' })
    }

    if (comment.user_id !== user.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: '본인의 댓글만 삭제할 수 있습니다.' })
    }

    await supabase.from('community_comments').delete().eq('id', commentId)

    // comment_count 감소
    const { data: post } = await supabase
      .from('community_posts')
      .select('comment_count')
      .eq('id', postId)
      .single()

    if (post) {
      await supabase.from('community_posts').update({ comment_count: Math.max(0, (post.comment_count || 0) - 1) }).eq('id', postId)
    }

    res.json({ success: true })
  })
)

// ── 2. 게시글 상세 조회 ─────────────────────────────────────────
/**
 * @swagger
 * /api/community/{postId}:
 *   get:
 *     summary: 게시글 상세 조회
 *     tags: [Community]
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 게시글 상세 조회 성공
 *       404:
 *         description: 게시글을 찾을 수 없음
 */
router.get(
  '/:postId',
  asyncHandler(async (req, res) => {
    const { postId } = req.params

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, title, content, author_name, album_type, rating, likes, image_urls, created_at')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' })
    }

    const { data: comments, error: commentsError } = await supabase
      .from('community_comments')
      .select('id, user_id, author_name, content, created_at')
      .eq('post_id', postId)
      .order('created_at', { ascending: true })

    res.json({
      success: true,
      data: {
        ...post,
        comments: commentsError ? [] : comments,
      },
    })
  })
)

// ── 4. 게시글 삭제 ──────────────────────────────────────────────
/**
 * @swagger
 * /api/community/{postId}:
 *   delete:
 *     summary: 게시글 삭제
 *     tags: [Community]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 게시글 삭제 성공
 */
router.delete(
  '/:postId',
  asyncHandler(async (req, res) => {
    const user = await getAuthUser(req)
    if (!user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
    }

    const { postId } = req.params

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id, user_id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' })
    }

    if (post.user_id !== user.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: '본인의 게시글만 삭제할 수 있습니다.' })
    }

    // 연관 데이터 삭제 (댓글, 좋아요)
    await supabase.from('community_comments').delete().eq('post_id', postId)
    await supabase.from('community_post_likes').delete().eq('post_id', postId)
    await supabase.from('community_posts').delete().eq('id', postId)

    res.json({ success: true })
  })
)

module.exports = router
