const { SweetbookClient } = require('../sdk/client')
const { SweetbookApiError } = require('../sdk/core')
const ERROR_CODE = require('../constants/errorCode')
const axios = require('axios')

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
async function createBook({ title, subtitle, story, coverTemplateUid, contentTemplateUid, coverImageFileName, albumYear, highlights, type = 'child' }) {
  const client = getClient()
  const year = albumYear || new Date().getFullYear()

  // Step 1: 도서 생성 → bookUid 발급
  console.log('[Step 1] 시작 - books.create', { bookSpecUid: 'SQUAREBOOK_HC', title, creationType: 'TEST' })
  console.log('[books.create URL]', process.env.SWEETBOOK_BASE_URL + '/v1/Books')
  const createParams = { bookSpecUid: 'SQUAREBOOK_HC', title, creationType: 'TEST' }
  console.log('[books.create 파라미터]', JSON.stringify(createParams, null, 2))
  let bookUid
  try {
    const bookResult = await client.books.create(createParams)
    bookUid = bookResult.bookUid
    console.log('[Step 1] 완료 → bookUid:', bookUid)
  } catch (err) {
    console.error('[Step 1] 실패 - books.create 에러')
    console.error('  message:', err.message)
    console.error('  statusCode:', err.statusCode)
    console.error('  errorCode:', err.errorCode)
    console.error('  details:', err.details)
    handleSweetbookError(err)
  }

  // Step 2: 표지 추가 (multipart/form-data, parameters는 SDK 내부에서 JSON 직렬화)
  let coverParams
  if (coverTemplateUid === '4MY2fokVjkeY') {
    coverParams = {
      spineTitle: title,
      dateRange: `${year}.01 - ${year}.12`,
      frontPhoto: 'https://picsum.photos/800/1050',
    }
  } else if (coverTemplateUid === '79yjMH3qRPly') {
    coverParams = { title, dateRange: subtitle }
    if (coverImageFileName) coverParams.coverPhoto = coverImageFileName
  } else {
    coverParams = {}
  }
  try {
    const templateRes = await axios.get(
      `${process.env.SWEETBOOK_BASE_URL}/v1/templates/${coverTemplateUid}`,
      { headers: { Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}` } }
    )
    console.log('[템플릿 상세]', JSON.stringify(templateRes.data, null, 2))
  } catch (err) {
    console.error('[템플릿 상세] 조회 실패:', err.message)
  }

  console.log('[Step 2] 시작 - covers.create', { bookUid, templateUid: coverTemplateUid, coverParams })
  try {
    await client.covers.create(bookUid, coverTemplateUid, coverParams)
    console.log('[Step 2] 완료')
  } catch (err) {
    console.error('[Step 2] 실패 - covers.create 에러')
    console.error('  message:', err.message)
    console.error('  statusCode:', err.statusCode)
    console.error('  errorCode:', err.errorCode)
    console.error('  details:', err.details)
    handleSweetbookError(err)
  }

  try {
    const tplRes = await axios.get(
      `${process.env.SWEETBOOK_BASE_URL}/v1/templates/vHA59XPPKqak`,
      { headers: { Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}` } }
    )
    console.log('[내지 템플릿 상세]', JSON.stringify(tplRes.data.data.parameters, null, 2))
  } catch (err) {
    console.error('[내지 템플릿 상세] 조회 실패:', err.message)
  }

  // Step 3: 전체 스토리 1페이지 삽입 (multipart/form-data, parameters는 SDK 내부에서 JSON 직렬화)
  const storyTemplateUid = 'vHA59XPPKqak'
  console.log('[Step 3] 시작 - contents.insert (전체 스토리)', { bookUid, templateUid: storyTemplateUid })
  try {
    await client.contents.insert(
      bookUid,
      storyTemplateUid,
      { date: `${year}.01 - ${year}.12`, title, diaryText: story },
      { breakBefore: 'page' }
    )
    console.log('[Step 3] 완료')
  } catch (err) {
    console.error('[Step 3] 실패 - contents.insert (전체 스토리) 에러')
    console.error('  message:', err.message)
    console.error('  statusCode:', err.statusCode)
    console.error('  errorCode:', err.errorCode)
    console.error('  details:', err.details)
    handleSweetbookError(err)
  }

  // Step 4: 타입별 내지 삽입
  let contentPageCount = 0

  if (type === 'child' || type === 'pet') {
    // child/pet: 1~12월 반복
    for (let month = 1; month <= 12; month++) {
      const highlight = highlights.find((h) => h.month === month)
      const content = highlight?.content?.trim() || '이달은 조용히 흘러갔어요.'
      console.log(`[Step 4] 시작 - contents.insert (${month}월)`, { content })
      try {
        await client.contents.insert(
          bookUid,
          contentTemplateUid,
          { date: `${month}.01`, title: `${month}월`, diaryText: content },
          { breakBefore: 'page' }
        )
        console.log(`[Step 4] 완료 - ${month}월`)
        contentPageCount++
      } catch (err) {
        console.error(`[Step 4] 실패 - contents.insert (${month}월) 에러`)
        console.error('  message:', err.message)
        console.error('  statusCode:', err.statusCode)
        console.error('  errorCode:', err.errorCode)
        console.error('  details:', err.details)
        handleSweetbookError(err)
      }
    }
  } else if (type === 'travel') {
    // travel: highlights 순서대로
    for (let i = 0; i < highlights.length; i++) {
      const h = highlights[i]
      console.log(`[Step 4] 시작 - contents.insert (travel ${i + 1}/${highlights.length})`, { date: h.date, content: h.content })
      try {
        await client.contents.insert(
          bookUid,
          contentTemplateUid,
          { date: h.date, title: h.date, diaryText: h.content },
          { breakBefore: 'page' }
        )
        console.log(`[Step 4] 완료 - travel ${i + 1}`)
        contentPageCount++
      } catch (err) {
        console.error(`[Step 4] 실패 - contents.insert (travel ${i + 1}) 에러`)
        console.error('  message:', err.message)
        console.error('  statusCode:', err.statusCode)
        console.error('  errorCode:', err.errorCode)
        console.error('  details:', err.details)
        handleSweetbookError(err)
      }
    }
  } else if (type === 'memory') {
    // memory: highlights 순서대로
    for (let i = 0; i < highlights.length; i++) {
      const h = highlights[i]
      console.log(`[Step 4] 시작 - contents.insert (memory ${i + 1}/${highlights.length})`, { title: h.title, content: h.content })
      try {
        await client.contents.insert(
          bookUid,
          contentTemplateUid,
          { date: h.title, title: h.title, diaryText: h.content },
          { breakBefore: 'page' }
        )
        console.log(`[Step 4] 완료 - memory ${i + 1}`)
        contentPageCount++
      } catch (err) {
        console.error(`[Step 4] 실패 - contents.insert (memory ${i + 1}) 에러`)
        console.error('  message:', err.message)
        console.error('  statusCode:', err.statusCode)
        console.error('  errorCode:', err.errorCode)
        console.error('  details:', err.details)
        handleSweetbookError(err)
      }
    }
  }

  // Step 5: 빈 페이지 추가 (최소 24페이지: 표지 1 + 전체스토리 1 + 내지 + 빈페이지)
  const BLANK_TEMPLATE_UID = '2mi1ao0Z4Vxl'
  const MIN_PAGES = 24
  const usedPages = 1 + 1 + contentPageCount // 표지 + 전체스토리 + 내지
  const BLANK_PAGE_COUNT = Math.max(0, MIN_PAGES - usedPages)
  console.log(`[Step 5] 시작 - 빈 페이지 ${BLANK_PAGE_COUNT}개 추가 (사용: ${usedPages}, 최소: ${MIN_PAGES})`)
  for (let i = 1; i <= BLANK_PAGE_COUNT; i++) {
    try {
      await client.contents.insert(bookUid, BLANK_TEMPLATE_UID, {}, { breakBefore: 'page' })
      console.log(`[Step 5] 빈 페이지 ${i}/${BLANK_PAGE_COUNT} 추가 완료`)
    } catch (err) {
      console.error(`[Step 5] 빈 페이지 ${i} 추가 실패`)
      console.error('  message:', err.message)
      console.error('  statusCode:', err.statusCode)
      console.error('  errorCode:', err.errorCode)
      console.error('  details:', err.details)
      handleSweetbookError(err)
    }
  }

  try {
    const specRes = await axios.get(
      `${process.env.SWEETBOOK_BASE_URL}/v1/book-specs/SQUAREBOOK_HC`,
      { headers: { Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}` } }
    )
    console.log('[BookSpec]', JSON.stringify(specRes.data.data, null, 2))
  } catch (err) {
    console.error('[BookSpec] 조회 실패:', err.message)
  }

  // Step 6: 도서 최종화
  console.log('[Step 6] 시작 - books.finalize', { bookUid })
  try {
    const finalizeResult = await client.books.finalize(bookUid)
    console.log('[finalize 성공]', JSON.stringify(finalizeResult, null, 2))
    console.log('[Step 6] 완료 → 도서 생성 성공')
  } catch (err) {
    console.error('[Step 6] 실패 - books.finalize 에러')
    console.error('  message:', err.message)
    console.error('  statusCode:', err.statusCode)
    console.error('  errorCode:', err.errorCode)
    console.error('  details:', err.details)
    handleSweetbookError(err)
  }

  return { bookUid }
}

// ── 2. 표지 이미지 업로드 ────────────────────────────────────
/**
 * @param {string} bookUid
 * @param {Buffer} fileBuffer
 * @param {string} mimeType
 * @returns {Promise<{fileName: string, thumbnailUrl: string}>}
 */
async function uploadCoverImage(bookUid, fileBuffer, mimeType) {
  const client = getClient()

  try {
    const blob = new Blob([fileBuffer], { type: mimeType })
    const result = await client.photos.upload(bookUid, blob)
    return { fileName: result.fileName, thumbnailUrl: result.thumbnailUrl }
  } catch (err) {
    handleSweetbookError(err)
  }
}

// ── 3. 템플릿 목록 조회 ──────────────────────────────────────
/**
 * SDK에 템플릿 클라이언트가 없어 직접 fetch 사용
 * @param {object} params
 * @param {'cover'|'content'} params.kind
 * @param {string} [params.bookSpecUid='SQUAREBOOK_HC']
 * @param {string} [params.category]
 * @returns {Promise<Array>}
 */
async function getTemplates({ kind, bookSpecUid = 'SQUAREBOOK_HC', category } = {}) {
  const baseUrl = process.env.SWEETBOOK_BASE_URL || 'https://api-sandbox.sweetbook.com'
  const qs = new URLSearchParams({ kind, bookSpecUid })
  if (category) qs.append('category', category)

  let response
  try {
    response = await fetch(`${baseUrl}/v1/templates?${qs.toString()}`, {
      headers: {
        Authorization: `Bearer ${process.env.SWEETBOOK_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })
  } catch (err) {
    throw new ServiceError(ERROR_CODE.SWEETBOOK_API_ERROR, '템플릿 조회 중 네트워크 오류가 발생했습니다.')
  }

  if (!response.ok) {
    throw new ServiceError(ERROR_CODE.SWEETBOOK_API_ERROR, `템플릿 조회 실패 (HTTP ${response.status})`)
  }

  const body = await response.json()
  return body?.data ?? body
}

// ── 4. 주문 예상 금액 조회 ───────────────────────────────────
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

// ── 5. 주문 생성 (402 에러 처리 포함) ───────────────────────
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
async function createOrder(bookUid, shipping) {
  const client = getClient()

  try {
    const result = await client.orders.create({ items: [{ bookUid, quantity: 1 }], shipping })
    console.log('[createOrder 성공]', JSON.stringify(result, null, 2))
    return result
  } catch (err) {
    console.error('[createOrder 에러]', JSON.stringify(err.details, null, 2))
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

// ── 6. 주문 상태 조회 ────────────────────────────────────────
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

// ── 7. 주문 취소 ────────────────────────────────────────────
/**
 * @param {string} orderUid
 * @returns {Promise<object>}
 */
async function cancelOrder(orderUid) {
  const client = getClient()

  if (process.env.NODE_ENV !== 'production') {
    console.log('[cancelOrder] 주문 취소 요청:', orderUid)
  }

  try {
    const result = await client.orders.cancel(orderUid, '고객 요청으로 인한 취소')
    if (process.env.NODE_ENV !== 'production') {
      console.log('[cancelOrder] 취소 완료:', JSON.stringify(result, null, 2))
    }
    return result
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[cancelOrder] 취소 실패:', err.message)
    }
    handleSweetbookError(err)
  }
}

// ── 8. 충전금 잔액 조회 ──────────────────────────────────────
/**
 * @returns {Promise<object>}
 */
async function getCredits() {
  const client = getClient()

  try {
    return await client.credits.getBalance()
  } catch (err) {
    handleSweetbookError(err)
  }
}

module.exports = {
  ServiceError,
  createBook,
  uploadCoverImage,
  getTemplates,
  estimateOrder,
  createOrder,
  getOrder,
  cancelOrder,
  getCredits,
}
