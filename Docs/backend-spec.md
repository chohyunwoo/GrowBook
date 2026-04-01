# GrowBook 백엔드 스펙

## 환경 변수 (.env.example)

```
ANTHROPIC_API_KEY=your_claude_api_key_here
SWEETBOOK_API_KEY=your_sweetbook_sandbox_key_here
SWEETBOOK_BASE_URL=https://api-sandbox.sweetbook.com
ALLOWED_ORIGIN=http://localhost:5173
PORT=3000
```

---

## asyncHandler 미들웨어

```javascript
// src/middlewares/asyncHandler.js
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)
module.exports = asyncHandler
```

---

## 에러 코드 상수

```javascript
// src/constants/errorCode.js
const ERROR_CODE = {
  INVALID_INPUT: 'INVALID_INPUT',
  INSUFFICIENT_CREDIT: 'INSUFFICIENT_CREDIT',
  CLAUDE_API_ERROR: 'CLAUDE_API_ERROR',
  SWEETBOOK_API_ERROR: 'SWEETBOOK_API_ERROR',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  FILE_SIZE_EXCEEDED: 'FILE_SIZE_EXCEEDED'
}
module.exports = ERROR_CODE
```

---

## index.js 기본 설정

- `helmet()` 적용
- `morgan('dev')` 적용
- `cors({ origin: process.env.ALLOWED_ORIGIN })` 적용
- `express.json({ limit: '1mb' })` 적용
- 서버 시작 시 필수 환경변수 검증
- 전역 에러 핸들러 (스택 트레이스 응답 제외)

---

## API 엔드포인트 상세

### POST /api/story/generate

Claude AI로 성장 스토리 + 제목 + 부제를 JSON으로 생성  
Rate limit: `express-rate-limit` 사용, 15분당 10회

**Request Body:**
```json
{
  "name": "지호",
  "birthYear": 2022,
  "albumYear": 2025,
  "highlights": [
    { "month": 1, "content": "처음으로 엄마라고 말했어요" },
    { "month": 2, "content": "" },
    ...
  ]
}
```

**유효성 검사:**
- `name`: 필수, 1~50자
- `birthYear`: 필수, 2000~현재연도
- `albumYear`: 필수, 2000~현재연도, **`albumYear >= birthYear` 이어야 함**
- `highlights`: 필수, 12개 고정 (빈 달은 빈 문자열 `""`)

**나이 계산:**
```javascript
const age = albumYear - birthYear  // 서버에서 계산 후 Claude 프롬프트에 전달
```

**Claude 프롬프트:**
- system: `"당신은 따뜻한 감성의 글작가입니다. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요."`
- user: 이름 / 나이(`albumYear - birthYear`) / 연도 / 입력된 월별 하이라이트(빈 달 제외) 전달
- 반환 형식: JSON (`title` 20자 이내, `subtitle` 30자 이내, `story` 500자 내외)
- 안전 파싱: `text.match(/\{[\s\S]*\}/)[0]`으로 JSON 블록만 추출

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "지호의 2025년 — 처음으로 가득한 날들",
    "subtitle": "엄마를 처음 부른 날부터 산타를 만난 날까지",
    "story": "2025년, 지호는 정말 많이 자랐어요..."
  }
}
```

---

### POST /api/books/create

Sweetbook API SDK를 사용해 4단계를 순차적으로 실행

**Request Body:**
```json
{
  "title": "지호의 2025년",
  "subtitle": "처음으로 가득한 날들",
  "story": "전체 스토리 텍스트",
  "coverTemplateUid": "선택한_표지_템플릿_UID",
  "contentTemplateUid": "내지_컬럼_템플릿_UID",
  "coverImageFileName": "업로드된_이미지_파일명.jpg",
  "highlights": [{ "month": 1, "content": "..." }]
}
```

**처리 순서 (SDK 활용):**

```
1. client.books.create({ bookSpecUid: 'SQUAREBOOK_HC', title })
   → bookUid 발급

2. client.covers.create(bookUid, coverTemplateUid, { bookTitle, subtitle, frontPhoto: coverImageFileName })
   → 표지 추가

3. client.contents.insert(bookUid, contentTemplateUid, { story }, { breakBefore: 'page' })
   → 전체 스토리 1페이지

4. 1~12월 반복 (총 12회):
   client.contents.insert(
     bookUid,
     contentTemplateUid,
     { month: `${month}월`, story: content || '이달은 조용히 흘러갔어요.' },
     { breakBefore: 'page' }
   )

5. client.books.finalize(bookUid)
   → 최종화
```

**Response:**
```json
{ "success": true, "data": { "bookUid": "bk_xxxxx" } }
```

---

### POST /api/books/:bookUid/upload-cover-image

표지 이미지 업로드

- `multer`로 `multipart/form-data` 수신 (최대 20MB, 허용 MIME 타입만)
- `fileBuffer`를 `Blob`으로 변환 후 `client.photos.upload(bookUid, blob)` 호출

**Response:**
```json
{ "success": true, "data": { "fileName": "...", "thumbnailUrl": "..." } }
```

---

### GET /api/templates

Sweetbook API 템플릿 목록 조회

**Query Parameters:**
- `kind`: `cover` | `content`
- `bookSpecUid`: 기본값 `SQUAREBOOK_HC`
- `category`: `diary`

---

### POST /api/orders/estimate

주문 예상 금액 조회

**Request Body:**
```json
{ "bookUid": "bk_xxxxx" }
```

---

### POST /api/orders

주문 생성

**Request Body:**
```json
{
  "bookUid": "bk_xxxxx",
  "shipping": {
    "recipientName": "홍길동",
    "recipientPhone": "010-1234-5678",
    "postalCode": "06101",
    "address1": "서울시 강남구 테헤란로 123",
    "address2": "4층",
    "memo": "부재시 경비실"
  }
}
```

**필수 필드:** `recipientName`, `recipientPhone`, `postalCode`, `address1`  
**선택 필드:** `address2`, `memo`

**402 에러 처리:**
```json
{
  "success": false,
  "error": "INSUFFICIENT_CREDIT",
  "data": { "required": 64400, "balance": 10000 }
}
```

---

### GET /api/orders/:orderUid

주문 상태 조회

---

### GET /api/credits

충전금 잔액 조회

---

## 공통 응답 형식

```json
// 성공
{ "success": true, "data": { ... } }

// 실패
{ "success": false, "error": "에러코드", "message": "사용자 친화적 메시지" }
```

> 스택 트레이스, 내부 정보 절대 포함 금지

---

## 주문 상태 코드 상수

```javascript
const ORDER_STATUS = {
  PAID: 20,
  IN_PRODUCTION: 40,
  SHIPPED: 60,
  DELIVERED: 70,
  CANCELLED: 80
}
```

---

## Swagger 설정

- 라이브러리: `swagger-jsdoc` + `swagger-ui-express`
- 경로: `GET /api-docs`
- 모든 엔드포인트에 `swagger-jsdoc` 주석 포함
- request/response 예시 포함
- 서버 정보: Sandbox 환경 명시

---

## 포트

`3000` (백엔드)
