const express = require('express')
const { SweetbookClient } = require('../sdk/client')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')
const { createOrder, estimateOrder, getOrder, ServiceError } = require('../services/sweetbookService')

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
    const { bookUid, shipping } = req.body

    if (!bookUid) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'bookUid가 필요합니다.' })
    }
    if (!shipping?.recipientName || !shipping?.recipientPhone || !shipping?.postalCode || !shipping?.address1) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '배송 필수 항목이 누락되었습니다. (recipientName, recipientPhone, postalCode, address1)' })
    }

    try {
      const result = await createOrder(bookUid, shipping)
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

module.exports = router
