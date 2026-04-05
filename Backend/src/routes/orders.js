const express = require('express')
const { SweetbookClient } = require('../sdk/client')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')
const { createOrder, estimateOrder, getOrder, cancelOrder, ServiceError } = require('../services/sweetbookService')
const { supabase, saveOrder, updateOrderStatus } = require('../services/supabaseService')

const router = express.Router()

function getSweetbookClient() {
  return new SweetbookClient({
    apiKey: process.env.SWEETBOOK_API_KEY,
    baseUrl: process.env.SWEETBOOK_BASE_URL ? `${process.env.SWEETBOOK_BASE_URL}/v1` : undefined,
  })
}

/**
 * @swagger
 * /api/orders/estimate:
 *   post:
 *     summary: 주문 예상 금액 조회
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookUid]
 *             properties:
 *               bookUid:
 *                 type: string
 *                 example: bk_xxxxx
 *     responses:
 *       200:
 *         description: 예상 금액 조회 성공
 */
router.post(
  '/estimate',
  asyncHandler(async (req, res) => {
    const { bookUid } = req.body
    if (!bookUid) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'bookUid가 필요합니다.' })
    }

    try {
      const result = await estimateOrder(bookUid)
      res.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof ServiceError) {
        return res.status(502).json({ success: false, error: err.code, message: err.message })
      }
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '예상 금액 조회 중 오류가 발생했습니다.' })
    }
  })
)

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: 주문 생성
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [bookUid, shipping]
 *             properties:
 *               bookUid:
 *                 type: string
 *               shipping:
 *                 type: object
 *                 required: [recipientName, recipientPhone, postalCode, address1]
 *                 properties:
 *                   recipientName:
 *                     type: string
 *                   recipientPhone:
 *                     type: string
 *                   postalCode:
 *                     type: string
 *                   address1:
 *                     type: string
 *                   address2:
 *                     type: string
 *                   memo:
 *                     type: string
 *     responses:
 *       200:
 *         description: 주문 생성 성공
 *       402:
 *         description: 충전금 부족
 *         content:
 *           application/json:
 *             example:
 *               success: false
 *               error: INSUFFICIENT_CREDIT
 *               data:
 *                 required: 64400
 *                 balance: 10000
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { bookUid, shipping, title, type } = req.body

    if (!bookUid) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'bookUid가 필요합니다.' })
    }
    if (!shipping?.recipientName || !shipping?.recipientPhone || !shipping?.postalCode || !shipping?.address1) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '배송 필수 항목이 누락되었습니다. (recipientName, recipientPhone, postalCode, address1)' })
    }

    try {
      const result = await createOrder(bookUid, shipping)

      // Supabase에 주문 정보 저장
      const token = req.headers.authorization?.replace('Bearer ', '')
      if (token) {
        try {
          const { data: { user } } = await supabase.auth.getUser(token)
          if (user) {
            await saveOrder(user.id, {
              orderUid: result.orderUid,
              albumTitle: title || '',
              albumType: type || 'child',
              status: 20,
            })
          }
        } catch (saveErr) {
          console.error('[orders] Supabase 주문 저장 실패:', saveErr.message)
        }
      }

      res.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof ServiceError && err.code === ERROR_CODE.INSUFFICIENT_CREDIT) {
        return res.status(402).json({ success: false, error: err.code, data: err.data })
      }
      if (err instanceof ServiceError) {
        return res.status(502).json({ success: false, error: err.code, message: err.message })
      }
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '주문 생성 중 오류가 발생했습니다.' })
    }
  })
)

/**
 * @swagger
 * /api/orders/{orderUid}:
 *   get:
 *     summary: 주문 상태 조회
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 주문 상태 조회 성공
 */
router.get(
  '/:orderUid',
  asyncHandler(async (req, res) => {
    const { orderUid } = req.params
    try {
      const result = await getOrder(orderUid)
      res.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof ServiceError) {
        return res.status(502).json({ success: false, error: err.code, message: err.message })
      }
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '주문 조회 중 오류가 발생했습니다.' })
    }
  })
)

/**
 * @swagger
 * /api/orders/{orderUid}/cancel:
 *   post:
 *     summary: 주문 취소
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderUid
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 주문 취소 성공
 */
router.post(
  '/:orderUid/cancel',
  asyncHandler(async (req, res) => {
    const { orderUid } = req.params
    try {
      const result = await cancelOrder(orderUid)

      // Supabase orders 테이블 status → 80 (CANCELLED)
      try {
        await updateOrderStatus(orderUid, 80)
        console.log('[orders] Supabase 주문 상태 업데이트 완료:', orderUid, '→ 80')
      } catch (updateErr) {
        console.error('[orders] Supabase 주문 상태 업데이트 실패:', updateErr.message)
      }

      res.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof ServiceError) {
        return res.status(502).json({ success: false, error: err.code, message: err.message })
      }
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '주문 취소 중 오류가 발생했습니다.' })
    }
  })
)

/**
 * @swagger
 * /api/orders/{orderUid}/shipping:
 *   patch:
 *     summary: 배송지 변경
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderUid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [recipientName, recipientPhone, postalCode, address1]
 *             properties:
 *               recipientName:
 *                 type: string
 *               recipientPhone:
 *                 type: string
 *               postalCode:
 *                 type: string
 *               address1:
 *                 type: string
 *               address2:
 *                 type: string
 *               shippingMemo:
 *                 type: string
 *     responses:
 *       200:
 *         description: 배송지 변경 성공
 *       400:
 *         description: 필수 항목 누락
 */
router.patch(
  '/:orderUid/shipping',
  asyncHandler(async (req, res) => {
    const { orderUid } = req.params
    const { recipientName, recipientPhone, postalCode, address1, address2, shippingMemo } = req.body

    if (!recipientName || !recipientPhone || !postalCode || !address1) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '배송 필수 항목이 누락되었습니다. (recipientName, recipientPhone, postalCode, address1)' })
    }

    const client = getSweetbookClient()
    try {
      const result = await client.orders.updateShipping(orderUid, {
        recipientName,
        recipientPhone,
        postalCode,
        address1,
        address2,
        memo: shippingMemo,
      })
      res.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof ServiceError) {
        return res.status(502).json({ success: false, error: err.code, message: err.message })
      }
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '배송지 변경 중 오류가 발생했습니다.' })
    }
  })
)

module.exports = router
