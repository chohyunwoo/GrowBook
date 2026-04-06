const { File } = require('node:buffer')
const { SweetbookClient } = require('../sdk/client')
const { SweetbookApiError } = require('../sdk/core')
const ERROR_CODE = require('../constants/errorCode')


// ── 서비스 전용 에러 ─────────────────────────────────────────
class ServiceError extends Error {
  constructor(code, message, data = null) {
    super(message)
    this.name = 'ServiceError'
    this.code = code
    this.data = data
  }
}

// ── 클라이언트 초기화 ────────────────────────────────────────
function getClient() {
  const baseUrl = process.env.SWEETBOOK_BASE_URL
    ? `${process.env.SWEETBOOK_BASE_URL}/v1`
    : undefined

  return new SweetbookClient({
    apiKey: process.env.SWEETBOOK_API_KEY,
    baseUrl,
  })
}

function handleSweetbookError(err) {
  if (err instanceof ServiceError) throw err
  throw new ServiceError(ERROR_CODE.SWEETBOOK_API_ERROR, err.message || 'Sweetbook API 오류가 발생했습니다.')
}

// ── 1. 도서 생성 (5단계) ─────────────────────────────────────
/**
 * @param {object} params
 * @param {string} params.title
 * @param {string} params.subtitle
 * @param {string} params.story
 * @param {string} params.coverTemplateUid
 * @param {string} params.contentTemplateUid
 * @param {string} params.coverImageFileName
 * @param {number} params.albumYear
 * @param {Array<{month: number, content: string}>} params.highlights
 * @returns {Promise<{bookUid: string}>}
 */
async function createBook({ title, subtitle, story, coverTemplateUid, contentTemplateUid, coverImageFile, coverImageFileName, albumYear, highlights, type = 'child' }) {
  const client = getClient()
  const year = albumYear || new Date().getFullYear()

  // Step 1: 도서 생성 → bookUid 발급
  const createParams = { bookSpecUid: 'SQUAREBOOK_HC', title, creationType: 'TEST' }
  let bookUid
  try {
    const bookResult = await client.books.create(createParams)
    bookUid = bookResult.bookUid
  } catch (err) {
    handleSweetbookError(err)
  }

  // Step 2: 표지 이미지 업로드 + 표지 추가
  let uploadedCoverFileName = coverImageFileName || null
  if (coverImageFile) {
    try {
      const file = new File(
        [coverImageFile.buffer],
        coverImageFile.originalname || 'cover.jpg',
        { type: coverImageFile.mimetype }
      )
      const uploadResult = await client.photos.upload(bookUid, file)
      uploadedCoverFileName = uploadResult.fileName
    } catch (err) {
      handleSweetbookError(err)
    }
  }

  let coverParams
  if (coverTemplateUid === '4MY2fokVjkeY') {
    coverParams = {
      spineTitle: title,
      dateRange: `${year}.01 - ${year}.12`,
      frontPhoto: uploadedCoverFileName || 'https://picsum.photos/800/1050',
    }
  } else if (coverTemplateUid === '79yjMH3qRPly') {
    coverParams = { title, dateRange: subtitle }
    if (uploadedCoverFileName) coverParams.coverPhoto = uploadedCoverFileName
  } else {
    coverParams = {}
  }

  try {
    await client.covers.create(bookUid, coverTemplateUid, coverParams)
  } catch (err) {
    handleSweetbookError(err)
  }

  // Step 3: 전체 스토리 1페이지 삽입
  const storyTemplateUid = 'vHA59XPPKqak'
  try {
    await client.contents.insert(
      bookUid,
      storyTemplateUid,
      { date: `${year}.01 - ${year}.12`, title, diaryText: story },
      { breakBefore: 'page' }
    )
  } catch (err) {
    handleSweetbookError(err)
  }

  // Step 4: 타입별 내지 삽입
  const PHOTO_TEMPLATE_UID = '2R8uMwVgTrpc'  // 사진 포함 템플릿
  const TEXT_TEMPLATE_UID = contentTemplateUid  // 텍스트 전용 템플릿
  let contentPageCount = 0

  async function insertContentPage(label, params, imageFile) {
    let templateUid = TEXT_TEMPLATE_UID
    let contentParams = { ...params }

    if (imageFile) {
      try {
        const file = new File(
          [imageFile.buffer],
          imageFile.originalname || 'highlight.jpg',
          { type: imageFile.mimetype }
        )
        const photo = await client.photos.upload(bookUid, file)
        contentParams.photo1 = photo.fileName
        templateUid = PHOTO_TEMPLATE_UID
      } catch (err) {
        // 이미지 업로드 실패 시 텍스트 전용 템플릿으로 fallback
      }
    }

    try {
      await client.contents.insert(bookUid, templateUid, contentParams, { breakBefore: 'page' })
      contentPageCount++
    } catch (err) {
      handleSweetbookError(err)
    }
  }

  if (type === 'child' || type === 'pet') {
    for (let month = 1; month <= 12; month++) {
      const highlight = highlights.find((h) => h.month === month)
      const content = highlight?.content?.trim() || '이달은 조용히 흘러갔어요.'
      await insertContentPage(`${month}월`, { date: `${month}.01`, title: highlight?.memo || `${month}월`, diaryText: content }, highlight?.imageFile)
    }
  } else if (type === 'travel') {
    for (let i = 0; i < highlights.length; i++) {
      const h = highlights[i]
      await insertContentPage(`travel ${i + 1}`, { date: h.date, title: h.memo || h.date, diaryText: h.content }, h.imageFile)
    }
  } else if (type === 'memory') {
    for (let i = 0; i < highlights.length; i++) {
      const h = highlights[i]
      await insertContentPage(`memory ${i + 1}`, { date: h.title, title: h.memo || h.title, diaryText: h.content }, h.imageFile)
    }
  }

  // Step 5: 빈 페이지 추가 (최소 24페이지, 4의 배수)
  const BLANK_TEMPLATE_UID = '2mi1ao0Z4Vxl'
  const minPages = 24
  const usedPages = 1 + contentPageCount // 전체스토리 + 내지 (표지는 pageCount에서 제외)
  let totalNeeded = Math.max(minPages, usedPages)
  if (totalNeeded % 4 !== 0) {
    totalNeeded = totalNeeded + (4 - totalNeeded % 4)
  }
  const blankPages = totalNeeded - usedPages
  for (let i = 1; i <= blankPages; i++) {
    try {
      await client.contents.insert(bookUid, BLANK_TEMPLATE_UID, {}, { breakBefore: 'page' })
    } catch (err) {
      handleSweetbookError(err)
    }
  }

  // Step 6: 도서 최종화
  try {
    await client.books.finalize(bookUid)
  } catch (err) {
    handleSweetbookError(err)
  }

  return { bookUid }
}

// ── 2. 주문 예상 금액 조회 ───────────────────────────────────
/**
 * @param {string} bookUid
 * @returns {Promise<object>}
 */
async function estimateOrder(bookUid) {
  const client = getClient()

  try {
    return await client.orders.estimate({ items: [{ bookUid }] })
  } catch (err) {
    handleSweetbookError(err)
  }
}

// ── 3. 주문 생성 (402 에러 처리 포함) ───────────────────────
/**
 * @param {string} bookUid
 * @param {object} shipping
 * @param {string} shipping.recipientName
 * @param {string} shipping.recipientPhone
 * @param {string} shipping.postalCode
 * @param {string} shipping.address1
 * @param {string} [shipping.address2]
 * @param {string} [shipping.memo]
 * @returns {Promise<object>}
 */
async function createOrder(bookUid, shipping, quantity = 1) {
  const client = getClient()

  try {
    const result = await client.orders.create({ items: [{ bookUid, quantity }], shipping })
    return result
  } catch (err) {
    if (err instanceof SweetbookApiError && err.statusCode === 402) {
      throw new ServiceError(
        ERROR_CODE.INSUFFICIENT_CREDIT,
        '충전금이 부족합니다.',
        { required: err.details?.required, balance: err.details?.balance }
      )
    }
    handleSweetbookError(err)
  }
}

// ── 4. 주문 상태 조회 ────────────────────────────────────────
/**
 * @param {string} orderUid
 * @returns {Promise<object>}
 */
async function getOrder(orderUid) {
  const client = getClient()

  try {
    return await client.orders.get(orderUid)
  } catch (err) {
    handleSweetbookError(err)
  }
}

// ── 5. 주문 취소 ────────────────────────────────────────────
/**
 * @param {string} orderUid
 * @returns {Promise<object>}
 */
async function cancelOrder(orderUid, cancelReason = '고객 요청으로 인한 취소') {
  const client = getClient()

  try {
    return await client.orders.cancel(orderUid, cancelReason)
  } catch (err) {
    handleSweetbookError(err)
  }
}

module.exports = {
  ServiceError,
  createBook,
  estimateOrder,
  createOrder,
  getOrder,
  cancelOrder,
}
