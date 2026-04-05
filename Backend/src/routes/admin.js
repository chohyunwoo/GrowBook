const express = require('express')
const { SweetbookClient } = require('../sdk/client')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')
const { supabase } = require('../services/supabaseService')
const { ServiceError } = require('../services/sweetbookService')

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
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, name, is_admin, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '사용자 목록 조회 중 오류가 발생했습니다.' })
    }

    res.json({ success: true, data })
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

    const [creditsResult, ordersResult] = await Promise.all([
      client.credits.getBalance().catch(() => null),
      supabase.from('orders').select('status'),
    ])

    console.log('[admin/dashboard] creditsResult:', creditsResult)
    console.log('[admin/dashboard] ordersResult.data:', ordersResult.data)
    console.log('[admin/dashboard] ordersResult.error:', ordersResult.error)

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

    const credits = { balance: creditsResult.balance }
    const stats = { totalCount, byStatus }
    console.log('[admin/dashboard] response:', { credits, stats })

    res.json({
      success: true,
      data: { credits, stats },
    })
  })
)

module.exports = router
