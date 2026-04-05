const crypto = require('crypto')
const express = require('express')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')
const { supabase } = require('../services/supabaseService')

const router = express.Router()

/**
 * @swagger
 * /api/share:
 *   post:
 *     summary: 공유 앨범 생성
 *     tags: [Share]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderUid, title]
 *             properties:
 *               orderUid:
 *                 type: string
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               story:
 *                 type: string
 *               albumType:
 *                 type: string
 *     responses:
 *       200:
 *         description: 공유 앨범 생성 성공
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { orderUid, title, subtitle, story, albumType } = req.body

    if (!orderUid || !title) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '필수 항목이 누락되었습니다. (orderUid, title)' })
    }

    const shareCode = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('shared_albums')
      .insert({
        share_code: shareCode,
        order_uid: orderUid,
        title,
        subtitle: subtitle || '',
        story: story || '',
        album_type: albumType || 'child',
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '공유 앨범 생성 중 오류가 발생했습니다.' })
    }

    const shareUrl = `${process.env.ALLOWED_ORIGIN}/share/${shareCode}`

    res.json({ success: true, data: { shareCode, shareUrl } })
  })
)

/**
 * @swagger
 * /api/share/{shareCode}:
 *   get:
 *     summary: 공유 앨범 조회
 *     tags: [Share]
 *     parameters:
 *       - in: path
 *         name: shareCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 공유 앨범 조회 성공
 *       404:
 *         description: 공유 앨범을 찾을 수 없음
 *       410:
 *         description: 공유 링크 만료
 */
router.get(
  '/:shareCode',
  asyncHandler(async (req, res) => {
    const { shareCode } = req.params

    const { data, error } = await supabase
      .from('shared_albums')
      .select('title, subtitle, story, album_type, created_at, expires_at')
      .eq('share_code', shareCode)
      .single()

    if (error || !data) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '공유 앨범을 찾을 수 없습니다.' })
    }

    if (new Date(data.expires_at) < new Date()) {
      return res.status(410).json({ success: false, error: 'EXPIRED', message: '공유 링크가 만료되었습니다.' })
    }

    res.json({
      success: true,
      data: {
        title: data.title,
        subtitle: data.subtitle,
        story: data.story,
        albumType: data.album_type,
        createdAt: data.created_at,
        expiresAt: data.expires_at,
      },
    })
  })
)

module.exports = router
