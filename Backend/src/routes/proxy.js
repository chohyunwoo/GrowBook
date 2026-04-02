const express = require('express')
const axios = require('axios')

const router = express.Router()

/**
 * @swagger
 * /api/proxy/image:
 *   get:
 *     summary: 외부 이미지 프록시 (CORS 우회)
 *     tags: [Proxy]
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
 *         description: url 파라미터 누락
 *       502:
 *         description: 외부 이미지 요청 실패
 */
router.get('/image', async (req, res) => {
  const { url } = req.query

  if (!url) {
    return res.status(400).json({ success: false, message: 'url 쿼리 파라미터가 필요합니다.' })
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
