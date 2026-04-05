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

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: 리뷰 작성
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderUid, rating, content]
 *             properties:
 *               orderUid:
 *                 type: string
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               content:
 *                 type: string
 *     responses:
 *       200:
 *         description: 리뷰 작성 성공
 *       401:
 *         description: 인증 실패
 *       409:
 *         description: 이미 리뷰 작성됨
 */
router.post(
  '/',
  (req, res, next) => {
    upload.any()(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'FILE_TYPE_NOT_ALLOWED') {
        return res.status(400).json({ success: false, error: ERROR_CODE.FILE_TYPE_NOT_ALLOWED, message: '허용되지 않는 파일 형식입니다. (jpg, png, webp만 허용)' })
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: ERROR_CODE.FILE_SIZE_EXCEEDED, message: '파일 크기가 5MB를 초과합니다.' })
      }
      next(err)
    })
  },
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '유효하지 않은 토큰입니다.' })
    }

    // 개별 필드 우선, data JSON 폴백
    let orderUid, rating, content
    if (req.body.orderUid) {
      orderUid = req.body.orderUid
      rating = req.body.rating ? Number(req.body.rating) : undefined
      content = req.body.content
    } else if (req.body.data) {
      const parsed = JSON.parse(req.body.data)
      ;({ orderUid, rating, content } = parsed)
    } else {
      ;({ orderUid, rating, content } = req.body)
    }

    if (!orderUid) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'orderUid가 필요합니다.' })
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'rating은 1~5 사이의 정수여야 합니다.' })
    }

    // 주문 상태 확인 (배송완료 = 70)
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('status, user_id')
      .eq('order_uid', orderUid)
      .eq('user_id', user.id)
      .single()

    if (orderError || !order) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '주문을 찾을 수 없습니다.' })
    }
    if (order.status !== 70) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '배송 완료된 주문만 리뷰를 작성할 수 있습니다.' })
    }

    // 중복 리뷰 확인
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('order_uid', orderUid)
      .eq('user_id', user.id)
      .single()

    if (existingReview) {
      return res.status(409).json({ success: false, error: 'CONFLICT', message: '이미 리뷰를 작성한 주문입니다.' })
    }

    // 이미지 업로드 (Supabase Storage)
    const imageFiles = (req.files || []).filter((f) => f.mimetype.startsWith('image/'))
    if (imageFiles.length > 5) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '이미지는 최대 5장까지 첨부할 수 있습니다.' })
    }
    const imageUrls = []
    for (let index = 0; index < imageFiles.length; index++) {
      const file = imageFiles[index]
      const ext = (file.originalname.split('.').pop() || 'jpg').toLowerCase()
      const safeFileName = `${Date.now()}_${index}.${ext}`
      const filePath = `reviews/${user.id}/${safeFileName}`
      const { error: uploadError } = await supabase.storage
        .from('review-images')
        .upload(filePath, file.buffer, { contentType: file.mimetype })

      if (uploadError) {
        console.error('[reviews POST] Storage 에러:', uploadError)
      } else {
        const { data: urlData } = supabase.storage
          .from('review-images')
          .getPublicUrl(filePath)
        imageUrls.push(urlData.publicUrl)
      }
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        order_uid: orderUid,
        rating,
        content,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '리뷰 저장 중 오류가 발생했습니다.' })
    }

    res.json({ success: true, data })
  })
)

/**
 * @swagger
 * /api/reviews:
 *   get:
 *     summary: 전체 리뷰 목록 조회
 *     tags: [Reviews]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
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
 *         description: 리뷰 목록 조회 성공
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { type } = req.query
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10))
    const from = (page - 1) * limit
    const to = from + limit - 1

    // type 필터가 있으면 orders 테이블에서 해당 타입의 order_uid 목록을 먼저 조회
    let orderUids = null
    if (type) {
      const { data: orders } = await supabase
        .from('orders')
        .select('order_uid')
        .eq('album_type', type)
      orderUids = orders ? orders.map((o) => o.order_uid) : []
    }

    let query = supabase
      .from('reviews')
      .select('id, order_uid, rating, content, image_urls, created_at', { count: 'exact' })

    if (orderUids !== null) {
      if (orderUids.length === 0) {
        return res.json({ success: true, data: [], averageRating: 0, totalCount: 0, totalPages: 0 })
      }
      query = query.in('order_uid', orderUids)
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '리뷰 목록 조회 중 오류가 발생했습니다.' })
    }

    // 평균 별점 계산
    let ratingQuery = supabase.from('reviews').select('rating')
    if (orderUids !== null) {
      ratingQuery = ratingQuery.in('order_uid', orderUids)
    }
    const { data: allRatings } = await ratingQuery
    let averageRating = 0
    if (allRatings?.length) {
      const sum = allRatings.reduce((acc, r) => acc + r.rating, 0)
      averageRating = Math.round((sum / allRatings.length) * 10) / 10
    }

    res.json({ success: true, data, averageRating, totalCount: count, totalPages: Math.ceil(count / limit) })
  })
)

/**
 * @swagger
 * /api/reviews/detail/{reviewId}:
 *   get:
 *     summary: 단일 리뷰 상세 조회
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 리뷰 조회 성공
 *       404:
 *         description: 리뷰를 찾을 수 없음
 */
router.get(
  '/detail/:reviewId',
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params

    const { data, error } = await supabase
      .from('reviews')
      .select('id, user_id, order_uid, rating, content, image_urls, created_at')
      .eq('id', reviewId)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' })
    }

    res.json({ success: true, data })
  })
)

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: 리뷰 삭제
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 리뷰 삭제 성공
 *       403:
 *         description: 본인의 리뷰만 삭제 가능
 *       404:
 *         description: 리뷰를 찾을 수 없음
 */
router.delete(
  '/:reviewId',
  asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '유효하지 않은 토큰입니다.' })
    }

    const { reviewId } = req.params

    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, user_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' })
    }

    if (review.user_id !== user.id) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: '본인의 리뷰만 삭제할 수 있습니다.' })
    }

    await supabase.from('reviews').delete().eq('id', reviewId)

    res.json({ success: true })
  })
)

/**
 * @swagger
 * /api/reviews/{orderUid}:
 *   get:
 *     summary: 특정 주문의 리뷰 조회
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: orderUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 리뷰 조회 성공
 *       404:
 *         description: 리뷰를 찾을 수 없음
 */
router.get(
  '/:orderUid',
  asyncHandler(async (req, res) => {
    const { orderUid } = req.params

    const { data, error } = await supabase
      .from('reviews')
      .select('id, user_id, order_uid, rating, content, image_urls, created_at')
      .eq('order_uid', orderUid)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' })
    }

    res.json({ success: true, data })
  })
)

module.exports = router
