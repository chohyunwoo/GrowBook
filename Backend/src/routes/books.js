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
  limits: { fileSize: MAX_FILE_SIZE },
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

/**
 * @swagger
 * /api/books/create:
 *   post:
 *     summary: Sweetbook SDK로 도서 생성 (5단계)
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, subtitle, story, coverTemplateUid, contentTemplateUid, highlights]
 *             properties:
 *               title:
 *                 type: string
 *               subtitle:
 *                 type: string
 *               story:
 *                 type: string
 *               coverTemplateUid:
 *                 type: string
 *               contentTemplateUid:
 *                 type: string
 *               coverImageFileName:
 *                 type: string
 *               highlights:
 *                 type: array
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
  asyncHandler(async (req, res) => {
    const { title, subtitle, story, coverTemplateUid, contentTemplateUid, coverImageFileName, albumYear, highlights } = req.body

    if (!title || !subtitle || !story || !coverTemplateUid || !contentTemplateUid || !highlights) {
      return res.status(400).json({ success: false, error: ERROR_CODE.INVALID_INPUT, message: '필수 항목이 누락되었습니다.' })
    }

    try {
      const result = await createBook({ title, subtitle, story, coverTemplateUid, contentTemplateUid, coverImageFileName, albumYear, highlights })
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
