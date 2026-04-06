const express = require('express')
const axios = require('axios')
const { supabase } = require('../services/supabaseService')

const router = express.Router()

// ── URL 화이트리스트 ────────────────────────────────────────────
const ALLOWED_HOSTNAME_PATTERNS = [
  /^nxiavommglqbuqlhkrbw\.supabase\.co$/,
  /^[a-zA-Z0-9-]+\.supabase\.co$/,
]

function isAllowedUrl(rawUrl) {
  let parsed
  try {
    parsed = new URL(rawUrl)
  } catch {
    return false
  }

  // https만 허용 (file://, ftp://, data:// 등 차단)
  if (parsed.protocol !== 'https:') return false

  // 내부 IP 차단 (169.254.x.x, 10.x.x.x, 127.x.x.x, 192.168.x.x, 172.16-31.x.x, ::1, localhost)
  const hostname = parsed.hostname
  if (
    hostname === 'localhost' ||
    hostname === '::1' ||
    /^127\./.test(hostname) ||
    /^10\./.test(hostname) ||
    /^192\.168\./.test(hostname) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
    /^169\.254\./.test(hostname) ||
    /^0\./.test(hostname)
  ) {
    return false
  }

  return ALLOWED_HOSTNAME_PATTERNS.some((pattern) => pattern.test(hostname))
}

/**
 * @swagger
 * /api/proxy/image:
 *   get:
 *     summary: 외부 이미지 프록시 (CORS 우회)
 *     tags: [Proxy]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: url
 *         required: true
 *         schema:
 *           type: string
 *         description: 외부 이미지 URL
 *     responses:
 *       200:
 *         description: 이미지 바이너리
 *       400:
 *         description: url 파라미터 누락 또는 허용되지 않는 URL
 *       401:
 *         description: 인증 실패
 *       502:
 *         description: 외부 이미지 요청 실패
 */
router.get('/image', async (req, res) => {
  // 인증 확인
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '인증 토큰이 필요합니다.' })
  }

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ success: false, error: 'UNAUTHORIZED', message: '유효하지 않은 토큰입니다.' })
  }

  const { url } = req.query

  if (!url) {
    return res.status(400).json({ success: false, message: 'url 쿼리 파라미터가 필요합니다.' })
  }

  if (!isAllowedUrl(url)) {
    return res.status(400).json({ success: false, message: '허용되지 않는 URL입니다.' })
  }

  try {
    const response = await axios.get(url, { responseType: 'stream', timeout: 10000 })
    const contentType = response.headers['content-type']
    if (contentType) res.set('Content-Type', contentType)
    response.data.pipe(res)
  } catch (err) {
    console.error('[proxy/image] 외부 이미지 요청 실패:', err.message)
    res.status(502).json({ success: false, message: '외부 이미지를 가져오지 못했습니다.' })
  }
})

module.exports = router
