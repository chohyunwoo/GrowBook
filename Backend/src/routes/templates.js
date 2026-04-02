const express = require('express')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')

const router = express.Router()

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Sweetbook 템플릿 목록 조회
 *     tags: [Templates]
 *     parameters:
 *       - in: query
 *         name: kind
 *         required: true
 *         schema:
 *           type: string
 *           enum: [cover, content]
 *       - in: query
 *         name: bookSpecUid
 *         schema:
 *           type: string
 *           default: SQUAREBOOK_HC
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           example: diary
 *     responses:
 *       200:
 *         description: 템플릿 목록
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data: []
 */
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { kind, bookSpecUid = 'SQUAREBOOK_HC', category } = req.query

    if (!kind || !['cover', 'content'].includes(kind)) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'kind는 cover 또는 content여야 합니다.' })
    }

    const baseUrl = process.env.SWEETBOOK_BASE_URL || 'https://api-sandbox.sweetbook.com'
    const params = new URLSearchParams({ kind, bookSpecUid })
    if (category) params.append('category', category)

    let result
    try {
      const response = await fetch(`${baseUrl}/v1/templates?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      result = await response.json()
    } catch (err) {
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '템플릿 조회 중 오류가 발생했습니다.' })
    }

    const templates = result?.data ?? result
    if (Array.isArray(templates) && templates.length > 0) {
      console.log('[templates] 첫 번째 템플릿:', JSON.stringify(templates[0], null, 2))
      console.log('[templates] thumbnails 필드 존재 여부:', 'thumbnails' in templates[0])
    }

    res.json({ success: true, data: templates })
  })
)

// 템플릿 상세 조회 (임시)
router.get(
  '/:templateUid',
  asyncHandler(async (req, res) => {
    const { templateUid } = req.params
    const baseUrl = process.env.SWEETBOOK_BASE_URL || 'https://api-sandbox.sweetbook.com'

    let result
    try {
      const response = await fetch(`${baseUrl}/v1/templates/${templateUid}`, {
        headers: {
          Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }
      result = await response.json()
    } catch (err) {
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '템플릿 상세 조회 중 오류가 발생했습니다.' })
    }

    const template = result?.data ?? result
    console.log('[template 상세]', JSON.stringify(template, null, 2))
    res.json({ success: true, data: template })
  })
)

module.exports = router
