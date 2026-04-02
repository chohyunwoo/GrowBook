const express = require('express')
const rateLimit = require('express-rate-limit')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')
const { generateStory, generateCaption } = require('../services/claudeService')

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
    if (!Array.isArray(highlights) || highlights.length === 0) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '하이라이트는 1개 이상이어야 합니다.' })
    }
    if (type === 'travel' && highlights.some((h) => !h.date || !h.content)) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'travel 하이라이트는 date, content가 필수입니다.' })
    }
    if (type === 'memory' && highlights.some((h) => !h.title || !h.content)) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'memory 하이라이트는 title, content가 필수입니다.' })
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

/**
 * @swagger
 * /api/story/caption:
 *   post:
 *     summary: 하이라이트 텍스트를 감성 캡션으로 변환
 *     tags: [Story]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [highlight]
 *             properties:
 *               highlight:
 *                 type: string
 *                 example: 첫 걸음마를 떼었어요
 *               type:
 *                 type: string
 *                 example: child
 *     responses:
 *       200:
 *         description: 캡션 생성 성공
 */
router.post(
  '/caption',
  storyLimiter,
  asyncHandler(async (req, res) => {
    const { highlight, type } = req.body

    if (!highlight || typeof highlight !== 'string' || highlight.trim().length === 0) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'highlight 텍스트가 필요합니다.' })
    }

    try {
      const data = await generateCaption(highlight.trim(), type)
      res.json({ success: true, data })
    } catch (err) {
      return res.status(502).json({ success: false, error: err.code || ERROR_CODE.CLAUDE_API_ERROR, message: err.message })
    }
  })
)

module.exports = router
