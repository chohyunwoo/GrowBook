const express = require('express')
const { SweetbookClient } = require('../sdk/client')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')
const { supabase } = require('../services/supabaseService')

const router = express.Router()

function getSweetbookClient() {
  return new SweetbookClient({
    apiKey: process.env.SWEETBOOK_API_KEY,
    baseUrl: process.env.SWEETBOOK_BASE_URL ? `${process.env.SWEETBOOK_BASE_URL}/v1` : undefined,
  })
}

// ── 관리자 인증 미들웨어 ────────────────────────────────────────
const requireAdmin = asyncHandler(async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '유효하지 않은 토큰입니다.' })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return res.status(403).json({ success: false, error: 'FORBIDDEN', message: '관리자 권한이 필요합니다.' })
  }

  req.user = user
  next()
})

router.use(requireAdmin)

// ── 1. 전체 주문 목록 조회 ──────────────────────────────────────
/**
 * @swagger
 * /api/admin/orders:
 *   get:
 *     summary: 전체 주문 목록 조회 (관리자)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: integer
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *     responses:
 *       200:
 *         description: 주문 목록 조회 성공
 */
router.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const { status, from, to, limit, offset } = req.query
    const client = getSweetbookClient()

    try {
      const result = await client.orders.list({
        status: status ? Number(status) : undefined,
        from,
        to,
        limit: limit ? Number(limit) : undefined,
        offset: offset ? Number(offset) : undefined,
      })
      res.json({ success: true, data: result })
    } catch (err) {
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '주문 목록 조회 중 오류가 발생했습니다.' })
    }
  })
)

// ── 2. 주문 상세 조회 ───────────────────────────────────────────
/**
 * @swagger
 * /api/admin/orders/{orderUid}:
 *   get:
 *     summary: 주문 상세 조회 (관리자)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 주문 상세 조회 성공
 */
router.get(
  '/orders/:orderUid',
  asyncHandler(async (req, res) => {
    const { orderUid } = req.params
    const client = getSweetbookClient()

    try {
      const result = await client.orders.get(orderUid)
      res.json({ success: true, data: result })
    } catch (err) {
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '주문 조회 중 오류가 발생했습니다.' })
    }
  })
)

// ── 3. 전체 사용자 목록 조회 ────────────────────────────────────
/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: 전체 사용자 목록 조회 (관리자)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 사용자 목록 조회 성공
 */
router.get(
  '/users',
  asyncHandler(async (req, res) => {
    const [usersResult, orderCountsResult] = await Promise.all([
      supabase.from('profiles').select('id, email, name, is_admin, created_at').order('created_at', { ascending: false }),
      supabase.from('orders').select('user_id, status'),
    ])

    if (usersResult.error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '사용자 목록 조회 중 오류가 발생했습니다.' })
    }

    const orderData = orderCountsResult.data || []
    const users = usersResult.data.map((user) => {
      const userOrders = orderData.filter((o) => o.user_id === user.id)
      const cancelCount = userOrders.filter((o) => o.status === 80 || o.status === 81).length
      return {
        ...user,
        orderCount: userOrders.length,
        cancelCount,
        activeCount: userOrders.length - cancelCount,
      }
    })

    res.json({ success: true, data: users })
  })
)

// ── 4. 충전금 잔액 조회 ─────────────────────────────────────────
/**
 * @swagger
 * /api/admin/credits:
 *   get:
 *     summary: 충전금 잔액 조회 (관리자)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 잔액 조회 성공
 */
router.get(
  '/credits',
  asyncHandler(async (req, res) => {
    const client = getSweetbookClient()

    try {
      const result = await client.credits.getBalance()
      res.json({ success: true, data: result })
    } catch (err) {
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '충전금 조회 중 오류가 발생했습니다.' })
    }
  })
)

// ── 5. 상태별 주문 통계 ─────────────────────────────────────────
/**
 * @swagger
 * /api/admin/stats:
 *   get:
 *     summary: 상태별 주문 통계 (관리자)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 통계 조회 성공
 */
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from('orders')
      .select('status')

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '주문 통계 조회 중 오류가 발생했습니다.' })
    }

    const totalCount = data.length
    const byStatus = {}
    for (const row of data) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1
    }

    res.json({ success: true, data: { totalCount, byStatus } })
  })
)

// ── 6. 대시보드 (충전금 + 주문 통계) ────────────────────────────
/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: 대시보드 데이터 조회 (관리자)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: 대시보드 조회 성공
 */
router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const client = getSweetbookClient()

    // 이번 달 범위 계산
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()

    const [creditsResult, ordersResult, thisMonthResult] = await Promise.all([
      client.credits.getBalance().catch(() => null),
      supabase.from('orders').select('status'),
      supabase.from('orders').select('id').gte('ordered_at', monthStart).lte('ordered_at', monthEnd),
    ])

    if (!creditsResult) {
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '충전금 조회 중 오류가 발생했습니다.' })
    }

    if (ordersResult.error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '주문 통계 조회 중 오류가 발생했습니다.' })
    }

    const totalCount = ordersResult.data.length
    const byStatus = {}
    for (const row of ordersResult.data) {
      byStatus[row.status] = (byStatus[row.status] || 0) + 1
    }

    const thisMonthCount = thisMonthResult.data?.length || 0
    const activeCount = ordersResult.data.filter((row) => row.status !== 80 && row.status !== 81).length

    const credits = { balance: creditsResult.balance }
    const stats = { totalCount, thisMonthCount, activeCount, byStatus }

    res.json({
      success: true,
      data: { credits, stats },
    })
  })
)

// ── 7. 커뮤니티 게시글 목록 조회 ────────────────────────────────
/**
 * @swagger
 * /api/admin/community:
 *   get:
 *     summary: 전체 커뮤니티 게시글 목록 (관리자)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
  '/community',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10))
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data, error, count } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '게시글 목록 조회 중 오류가 발생했습니다.' })
    }

    res.json({ success: true, data, totalCount: count, totalPages: Math.ceil(count / limit) })
  })
)

// ── 8. 커뮤니티 게시글 강제 삭제 ────────────────────────────────
/**
 * @swagger
 * /api/admin/community/{postId}:
 *   delete:
 *     summary: 게시글 강제 삭제 (관리자)
 *     tags: [Admin]
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
  '/community/:postId',
  asyncHandler(async (req, res) => {
    const { postId } = req.params

    const { data: post, error: postError } = await supabase
      .from('community_posts')
      .select('id')
      .eq('id', postId)
      .single()

    if (postError || !post) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '게시글을 찾을 수 없습니다.' })
    }

    await supabase.from('community_comments').delete().eq('post_id', postId)
    await supabase.from('community_post_likes').delete().eq('post_id', postId)
    await supabase.from('community_posts').delete().eq('id', postId)

    res.json({ success: true })
  })
)

// ── 9. 전체 리뷰 목록 조회 ─────────────────────────────────────
/**
 * @swagger
 * /api/admin/reviews:
 *   get:
 *     summary: 전체 리뷰 목록 (관리자)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
  '/reviews',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 10))
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: reviews, error, count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '리뷰 목록 조회 중 오류가 발생했습니다.' })
    }

    // 작성자 정보 조회
    const userIds = [...new Set(reviews.map((r) => r.user_id))]
    const profileMap = {}
    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds)
      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = p
        }
      }
    }

    // 포토북 타입 조회
    const orderUids = [...new Set(reviews.map((r) => r.order_uid))]
    const orderMap = {}
    if (orderUids.length > 0) {
      const { data: orders } = await supabase
        .from('orders')
        .select('order_uid, album_type')
        .in('order_uid', orderUids)
      if (orders) {
        for (const o of orders) {
          orderMap[o.order_uid] = o
        }
      }
    }

    const data = reviews.map((review) => ({
      ...review,
      author_name: profileMap[review.user_id]?.name || '익명',
      author_email: profileMap[review.user_id]?.email || '',
      album_type: orderMap[review.order_uid]?.album_type || null,
    }))

    // 평균 별점 계산
    const { data: allRatings } = await supabase.from('reviews').select('rating')
    let averageRating = 0
    if (allRatings?.length) {
      const sum = allRatings.reduce((acc, r) => acc + r.rating, 0)
      averageRating = Math.round((sum / allRatings.length) * 10) / 10
    }

    res.json({ success: true, data, averageRating, totalCount: count, totalPages: Math.ceil(count / limit) })
  })
)

// ── 10. 리뷰 강제 삭제 ─────────────────────────────────────────
/**
 * @swagger
 * /api/admin/reviews/{reviewId}:
 *   delete:
 *     summary: 리뷰 강제 삭제 (관리자)
 *     tags: [Admin]
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
 */
router.delete(
  '/reviews/:reviewId',
  asyncHandler(async (req, res) => {
    const { reviewId } = req.params

    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '리뷰를 찾을 수 없습니다.' })
    }

    await supabase.from('reviews').delete().eq('id', reviewId)

    res.json({ success: true })
  })
)

module.exports = router
