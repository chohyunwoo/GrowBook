const express = require('express')
const rateLimit = require('express-rate-limit')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')
const { generateStory } = require('../services/claudeService')

const router = express.Router()

const storyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 150,
  message: { success: false, error: ERROR_CODE.INVALID_INPUT, message: '요청 한도를 초과했습니다. 15분 후 다시 시도해주세요.' },
})

/**
 * @swagger
 * /api/story/generate:
 *   post:
 *     summary: Claude AI로 성장 스토리 생성
 *     tags: [Story]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, birthYear, albumYear, highlights]
 *             properties:
 *               name:
 *                 type: string
 *                 example: 지호
 *               birthYear:
 *                 type: integer
 *                 example: 2022
 *               albumYear:
 *                 type: integer
 *                 example: 2025
 *               highlights:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     month:
 *                       type: integer
 *                     content:
 *                       type: string
 *     responses:
 *       200:
 *         description: 생성 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 title: 지호의 2025년 — 처음으로 가득한 날들
 *                 subtitle: 엄마를 처음 부른 날부터 산타를 만난 날까지
 *                 story: 2025년, 지호는 정말 많이 자랐어요...
 */
router.post(
  '/generate',
  storyLimiter,
  asyncHandler(async (req, res) => {
    const { type = 'child', name, birthYear, albumYear, period, highlights } = req.body
    const currentYear = new Date().getFullYear()
    const validTypes = ['child', 'pet', 'travel', 'memory']

    if (!validTypes.includes(type)) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: `type은 ${validTypes.join(', ')} 중 하나여야 합니다.` })
    }
    if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '이름은 1~50자 사이여야 합니다.' })
    }
    if ((type === 'child' || type === 'pet') && (!birthYear || birthYear < 2000 || birthYear > currentYear)) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: `출생 연도는 2000~${currentYear} 사이여야 합니다.` })
    }
    if ((type === 'child' || type === 'pet') && (!albumYear || albumYear < 2000 || albumYear > currentYear)) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: `앨범 연도는 2000~${currentYear} 사이여야 합니다.` })
    }
    if ((type === 'child' || type === 'pet') && albumYear < birthYear) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '앨범 연도는 출생 연도보다 크거나 같아야 합니다.' })
    }
    if ((type === 'travel' || type === 'memory') && (!period || typeof period !== 'string' || period.trim().length === 0)) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'period(기간)는 필수입니다.' })
    }
    if (!Array.isArray(highlights)) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '하이라이트는 배열이어야 합니다.' })
    }
    if (type === 'travel') {
      highlights.forEach((h, i) => { if (!h.date) h.date = `Day ${i + 1}` })
    }
    if (type === 'memory') {
      highlights.forEach((h, i) => { if (!h.title) h.title = `순간 ${i + 1}` })
    }

    try {
      const data = await generateStory({ type, name, birthYear, albumYear, period, highlights })
      res.json({ success: true, data })
    } catch (err) {
      const code = err.code === ERROR_CODE.CLAUDE_API_ERROR ? ERROR_CODE.CLAUDE_API_ERROR : ERROR_CODE.CLAUDE_API_ERROR
      return res.status(502).json({ success: false, error: code, message: err.message })
    }
  })
)

module.exports = router
