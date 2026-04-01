const express = require('express')
const { SweetbookClient } = require('../sdk/client')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')

const router = express.Router()

/**
 * @swagger
 * /api/credits:
 *   get:
 *     summary: 충전금 잔액 조회
 *     tags: [Credits]
 *     responses:
 *       200:
 *         description: 잔액 조회 성공
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const client = new SweetbookClient({
      apiKey: process.env.SWEETBOOK_API_KEY,
      baseUrl: process.env.SWEETBOOK_BASE_URL ? `${process.env.SWEETBOOK_BASE_URL}/v1` : undefined,
    })

    let result
    try {
      result = await client.credits.getBalance()
    } catch (err) {
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '잔액 조회 중 오류가 발생했습니다.' })
    }

    res.json({ success: true, data: result })
  })
)

module.exports = router
