const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const asyncHandler = require('../middlewares/asyncHandler')
const { supabase } = require('../services/supabaseService')
const { generateSlideshow, cleanup } = require('../services/videoService')

const router = express.Router()

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_BGM_TYPES = ['audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav']
const MAX_IMAGE_SIZE = 20 * 1024 * 1024 // 20MB
const MAX_BGM_SIZE = 10 * 1024 * 1024 // 10MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_SIZE },
  fileFilter: (_req, file, cb) => {
    if (file.fieldname === 'images' && ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else if (file.fieldname === 'bgm' && ALLOWED_BGM_TYPES.includes(file.mimetype)) {
      if (file.size > MAX_BGM_SIZE) {
        cb(Object.assign(new Error('BGM 파일 크기가 10MB를 초과했습니다.'), { code: 'BGM_FILE_TOO_LARGE' }))
      } else {
        cb(null, true)
      }
    } else {
      cb(Object.assign(new Error('허용되지 않는 파일 형식입니다.'), { code: 'FILE_TYPE_NOT_ALLOWED' }))
    }
  },
})

/**
 * @swagger
 * /api/video/generate:
 *   post:
 *     summary: 이미지 슬라이드쇼 영상 생성
 *     description: 업로드된 이미지들로 페이드 전환 효과가 적용된 1080x1080 MP4 슬라이드쇼 영상을 생성합니다.
 *     consumes:
 *       - multipart/form-data
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *               bgm:
 *                 type: string
 *                 format: binary
 *                 description: 배경음악 파일 (mp3, wav / 최대 10MB / 선택사항)
 *     responses:
 *       200:
 *         description: 생성된 MP4 영상 파일
 *         content:
 *           video/mp4:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: 이미지가 제공되지 않음
 *       500:
 *         description: 영상 생성 실패
 */
router.post(
  '/generate',
  (req, res, next) => {
    upload.fields([
      { name: 'images', maxCount: 50 },
      { name: 'bgm', maxCount: 1 },
    ])(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'LIMIT_FILE_SIZE') {
        err.status = 400
        err.message = '파일 크기 제한을 초과했습니다.'
      }
      next(err)
    })
  },
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

    const imageFiles = req.files?.images
    if (!imageFiles || imageFiles.length === 0) {
      const err = new Error('이미지를 1장 이상 업로드해주세요.')
      err.code = 'NO_IMAGES'
      err.status = 400
      throw err
    }

    const bgmFile = req.files?.bgm?.[0] || null
    if (bgmFile && bgmFile.size > 10 * 1024 * 1024) {
      const err = new Error('BGM 파일 크기가 10MB를 초과했습니다.')
      err.code = 'BGM_FILE_TOO_LARGE'
      err.status = 400
      throw err
    }

    console.log(`[video] ${imageFiles.length}장의 이미지로 슬라이드쇼 생성 시작${bgmFile ? ' (BGM 포함)' : ''}`)

    const imageBuffers = imageFiles.map((f) => f.buffer)
    const bgmBuffer = bgmFile ? bgmFile.buffer : null
    const bgmExt = bgmFile ? path.extname(bgmFile.originalname).toLowerCase() || '.mp3' : '.mp3'

    // 텍스트 오버레이 데이터 구성
    const title = req.body?.title || null
    const subtitle = req.body?.subtitle || null
    const story = req.body?.story || null
    let captions = req.body?.captions || null
    if (typeof captions === 'string') {
      try { captions = JSON.parse(captions) } catch { captions = [captions] }
    }
    const textData = (title || subtitle || captions || story)
      ? { title, subtitle, captions, story }
      : null

    const { outputPath, workDir } = await generateSlideshow(imageBuffers, bgmBuffer, bgmExt, textData)

    const filename = `growbook-slideshow-${Date.now()}.mp4`

    res.setHeader('Content-Type', 'video/mp4')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const stream = fs.createReadStream(outputPath)
    stream.pipe(res)
    stream.on('end', () => cleanup(workDir))
    stream.on('error', () => cleanup(workDir))
  }),
)

module.exports = router
