const express = require('express')
const rateLimit = require('express-rate-limit')
const Anthropic = require('@anthropic-ai/sdk')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')

const router = express.Router()

const storyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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
    const { name, birthYear, albumYear, highlights } = req.body
    const currentYear = new Date().getFullYear()

    if (!name || typeof name !== 'string' || name.trim().length < 1 || name.trim().length > 50) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '이름은 1~50자 사이여야 합니다.' })
    }
    if (!birthYear || birthYear < 2000 || birthYear > currentYear) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: `출생 연도는 2000~${currentYear} 사이여야 합니다.` })
    }
    if (!albumYear || albumYear < 2000 || albumYear > currentYear) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: `앨범 연도는 2000~${currentYear} 사이여야 합니다.` })
    }
    if (albumYear < birthYear) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '앨범 연도는 출생 연도보다 크거나 같아야 합니다.' })
    }
    if (!Array.isArray(highlights) || highlights.length !== 12) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '하이라이트는 12개 항목이어야 합니다.' })
    }

    const age = albumYear - birthYear
    const filledHighlights = highlights
      .filter((h) => h.content && h.content.trim() !== '')
      .map((h) => `${h.month}월: ${h.content}`)
      .join('\n')

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    let message
    try {
      message = await anthropic.messages.create({
        model: 'claude-opus-4-6',
        max_tokens: 1024,
        system: '당신은 따뜻한 감성의 글작가입니다. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요.',
        messages: [
          {
            role: 'user',
            content: `아이 이름: ${name.trim()}\n나이: ${age}살\n연도: ${albumYear}년\n\n월별 하이라이트:\n${filledHighlights || '(기록 없음)'}\n\n위 정보를 바탕으로 아이의 성장 스토리를 작성해주세요.\n다음 JSON 형식으로만 응답해주세요:\n{\n  "title": "20자 이내 제목",\n  "subtitle": "30자 이내 부제",\n  "story": "500자 내외 성장 스토리"\n}`,
          },
        ],
      })
    } catch (err) {
      return res.status(502).json({ success: false, error: ERROR_CODE.CLAUDE_API_ERROR, message: 'AI 스토리 생성 중 오류가 발생했습니다.' })
    }

    const text = message.content[0].text
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) {
      return res.status(502).json({ success: false, error: ERROR_CODE.CLAUDE_API_ERROR, message: 'AI 응답을 파싱할 수 없습니다.' })
    }

    let data
    try {
      data = JSON.parse(match[0])
    } catch {
      return res.status(502).json({ success: false, error: ERROR_CODE.CLAUDE_API_ERROR, message: 'AI 응답 JSON 파싱에 실패했습니다.' })
    }

    res.json({ success: true, data })
  })
)

module.exports = router
