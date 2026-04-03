const express = require('express')
const multer = require('multer')
const { SweetbookClient } = require('../sdk/client')
const asyncHandler = require('../middlewares/asyncHandler')
const ERROR_CODE = require('../constants/errorCode')
const { createBook, ServiceError } = require('../services/sweetbookService')

const router = express.Router()

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20MB

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE, fieldSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(Object.assign(new Error('허용되지 않는 파일 형식입니다.'), { code: 'FILE_TYPE_NOT_ALLOWED' }))
    }
  },
})

function getSweetbookClient() {
  return new SweetbookClient({
    apiKey: process.env.SWEETBOOK_API_KEY,
    baseUrl: process.env.SWEETBOOK_BASE_URL ? `${process.env.SWEETBOOK_BASE_URL}/v1` : undefined,
  })
}

// highlight_image_0 ~ highlight_image_21 + cover_image
const createBookFields = [
  { name: 'cover_image', maxCount: 1 },
  ...Array.from({ length: 22 }, (_, i) => ({ name: `highlight_image_${i}`, maxCount: 1 })),
]

/**
 * @swagger
 * /api/books/create:
 *   post:
 *     summary: Sweetbook SDK로 도서 생성 (multipart/form-data)
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [data]
 *             properties:
 *               data:
 *                 type: string
 *                 description: JSON 문자열 (bookData)
 *               cover_image:
 *                 type: string
 *                 format: binary
 *               highlight_image_0:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 도서 생성 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 bookUid: bk_xxxxx
 */
router.post(
  '/create',
  (req, res, next) => {
    upload.fields(createBookFields)(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'FILE_TYPE_NOT_ALLOWED') {
        return res.status(400).json({ success: false, error: ERROR_CODE.FILE_TYPE_NOT_ALLOWED, message: '허용되지 않는 파일 형식입니다. (jpg, png, webp만 허용)' })
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: ERROR_CODE.FILE_SIZE_EXCEEDED, message: '파일 크기가 20MB를 초과합니다.' })
      }
      next(err)
    })
  },
  asyncHandler(async (req, res) => {
    let bookData
    try {
      bookData = JSON.parse(req.body.data)
    } catch (err) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: 'data 필드는 유효한 JSON이어야 합니다.' })
    }

    const { title, subtitle, story, coverTemplateUid, contentTemplateUid, albumYear, highlights, type } = bookData

    if (!title || !subtitle || !story || !coverTemplateUid || !contentTemplateUid || !highlights) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '필수 항목이 누락되었습니다.' })
    }

    // 표지 이미지 매핑
    const coverImageFile = req.files?.cover_image?.[0] || null

    // 하이라이트 이미지 매핑
    for (let i = 0; i < highlights.length; i++) {
      const imageFile = req.files?.[`highlight_image_${i}`]?.[0]
      if (imageFile) {
        highlights[i].imageFile = imageFile
      }
    }

    try {
      const result = await createBook({ title, subtitle, story, coverTemplateUid, contentTemplateUid, coverImageFile, albumYear, highlights, type })
      res.json({ success: true, data: result })
    } catch (err) {
      if (err instanceof ServiceError) {
        return res.status(502).json({ success: false, error: err.code, message: err.message })
      }
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '도서 생성 중 오류가 발생했습니다.' })
    }
  })
)

/**
 * @swagger
 * /api/books/{bookUid}/upload-cover-image:
 *   post:
 *     summary: 표지 이미지 업로드
 *     tags: [Books]
 *     parameters:
 *       - in: path
 *         name: bookUid
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: 업로드 성공
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               data:
 *                 fileName: cover.jpg
 *                 thumbnailUrl: https://...
 */
router.post(
  '/:bookUid/upload-cover-image',
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (!err) return next()
      if (err.code === 'FILE_TYPE_NOT_ALLOWED') {
        return res.status(400).json({ success: false, error: ERROR_CODE.FILE_TYPE_NOT_ALLOWED, message: '허용되지 않는 파일 형식입니다. (jpg, png, webp만 허용)' })
      }
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ success: false, error: ERROR_CODE.FILE_SIZE_EXCEEDED, message: '파일 크기가 20MB를 초과합니다.' })
      }
      next(err)
    })
  },
  asyncHandler(async (req, res) => {
    const { bookUid } = req.params
    if (!req.file) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '이미지 파일이 필요합니다.' })
    }

    const client = getSweetbookClient()
    let result
    try {
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype })
      result = await client.photos.upload(bookUid, blob)
    } catch (err) {
      return res.status(502).json({ success: false, error: ERROR_CODE.SWEETBOOK_API_ERROR, message: '이미지 업로드 중 오류가 발생했습니다.' })
    }

    res.json({ success: true, data: { fileName: result.fileName, thumbnailUrl: result.thumbnailUrl } })
  })
)

module.exports = router
