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
    // 인증 확인
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '유효하지 않은 토큰입니다.' })
    }

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

// ── 커뮤니티: 공개 앨범 목록 조회 ───────────────────────────────
/**
 * @swagger
 * /api/share/community:
 *   get:
 *     summary: 커뮤니티 공개 앨범 목록
 *     tags: [Share]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [latest, popular]
 *           default: latest
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *     responses:
 *       200:
 *         description: 커뮤니티 목록 조회 성공
 */
router.get(
  '/community',
  asyncHandler(async (req, res) => {
    const { type, sort } = req.query
    const page = Math.max(1, parseInt(req.query.page, 10) || 1)
    const limit = Math.max(1, Math.min(50, parseInt(req.query.limit, 10) || 12))
    const from = (page - 1) * limit
    const to = from + limit - 1

    let query = supabase
      .from('shared_albums')
      .select('share_code, title, subtitle, album_type, author_name, likes, created_at, expires_at', { count: 'exact' })
      .eq('is_public', true)
      .gt('expires_at', new Date().toISOString())

    if (type) {
      query = query.eq('album_type', type)
    }

    if (sort === 'popular') {
      query = query.order('likes', { ascending: false })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    const { data, error, count } = await query.range(from, to)

    if (error) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '커뮤니티 목록 조회 중 오류가 발생했습니다.' })
    }

    res.json({
      success: true,
      data,
      totalCount: count,
      totalPages: Math.ceil(count / limit),
    })
  })
)

// ── 커뮤니티: 공개 설정 ─────────────────────────────────────────
/**
 * @swagger
 * /api/share/{shareCode}/public:
 *   post:
 *     summary: 공유 앨범을 커뮤니티에 공개
 *     tags: [Share]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 공개 설정 성공
 */
router.post(
  '/:shareCode/public',
  asyncHandler(async (req, res) => {
    const { shareCode } = req.params

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '유효하지 않은 토큰입니다.' })
    }

    // 본인 확인: shared_albums의 order_uid → orders의 user_id
    const { data: album, error: albumError } = await supabase
      .from('shared_albums')
      .select('order_uid')
      .eq('share_code', shareCode)
      .single()

    if (albumError || !album) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '공유 앨범을 찾을 수 없습니다.' })
    }

    const { data: order } = await supabase
      .from('orders')
      .select('user_id')
      .eq('order_uid', album.order_uid)
      .eq('user_id', user.id)
      .single()

    if (!order) {
      return res.status(403).json({ success: false, error: 'FORBIDDEN', message: '본인의 앨범만 공개할 수 있습니다.' })
    }

    // 사용자 이름 조회
    const { data: profile } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', user.id)
      .single()

    const { error: updateError } = await supabase
      .from('shared_albums')
      .update({ is_public: true, author_name: profile?.name || '익명' })
      .eq('share_code', shareCode)

    if (updateError) {
      return res.status(500).json({ success: false, error: 'DB_ERROR', message: '공개 설정 중 오류가 발생했습니다.' })
    }

    res.json({ success: true, data: { shareCode, isPublic: true } })
  })
)

// ── 커뮤니티: 좋아요 토글 ───────────────────────────────────────
/**
 * @swagger
 * /api/share/{shareCode}/like:
 *   post:
 *     summary: 좋아요 추가/취소 (토글)
 *     tags: [Share]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: shareCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 좋아요 토글 성공
 */
router.post(
  '/:shareCode/like',
  asyncHandler(async (req, res) => {
    const { shareCode } = req.params

    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '유효하지 않은 토큰입니다.' })
    }

    // 앨범 존재 확인
    const { data: album, error: albumError } = await supabase
      .from('shared_albums')
      .select('id, likes')
      .eq('share_code', shareCode)
      .single()

    if (albumError || !album) {
      return res.status(404).json({ success: false, error: 'NOT_FOUND', message: '공유 앨범을 찾을 수 없습니다.' })
    }

    // 기존 좋아요 확인
    const { data: existingLike } = await supabase
      .from('community_likes')
      .select('id')
      .eq('shared_album_id', album.id)
      .eq('user_id', user.id)
      .single()

    let liked
    let newLikes

    if (existingLike) {
      // 좋아요 취소
      await supabase.from('community_likes').delete().eq('id', existingLike.id)
      newLikes = Math.max(0, (album.likes || 0) - 1)
      liked = false
    } else {
      // 좋아요 추가
      await supabase.from('community_likes').insert({ shared_album_id: album.id, user_id: user.id })
      newLikes = (album.likes || 0) + 1
      liked = true
    }

    await supabase.from('shared_albums').update({ likes: newLikes }).eq('id', album.id)

    res.json({ success: true, data: { liked, likes: newLikes } })
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
