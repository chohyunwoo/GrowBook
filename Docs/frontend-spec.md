# GrowBook 프론트엔드 스펙

## 디렉토리 구조

```
Frontend/
├── src/
│   ├── api/
│   │   ├── client.js            # axios 인스턴스 (timeout: 30000)
│   │   ├── storyApi.js          # Claude AI 스토리 생성
│   │   ├── bookApi.js           # Books API
│   │   ├── orderApi.js          # Orders API
│   │   └── templateApi.js       # Templates API
│   └── App.jsx
├── .env.example
└── package.json
```

---

## 환경변수 (.env.example)

```
VITE_API_BASE_URL=http://localhost:3000
```

---

## axios client 설정 (src/api/client.js)

```javascript
import axios from 'axios'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000  // Claude AI 생성 요청이 30초 이상 소요될 수 있음
})

// 공통 에러 처리 인터셉터
client.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 402) {
      return Promise.reject({
        type: 'INSUFFICIENT_CREDIT',
        required: error.response.data?.data?.required,
        balance: error.response.data?.data?.balance
      })
    }
    return Promise.reject(error)
  }
)

export default client
```

---

## 전역 상태 (AppContext)

Context + useReducer로 관리할 데이터:
- `type`: 'child' (v1 고정)
- `name`: 아이 이름
- `birthYear`: 태어난 연도
- `albumYear`: 앨범 연도
- `highlights`: `[{ month: 1~12, content: string }]` 12개 고정
- `generatedStory`: `{ title, subtitle, story }` — Claude 생성 결과
- `bookUid`: Sweetbook API 책 ID
- `coverImageFile`: 업로드한 이미지 File 객체
- `coverImagePreview`: 로컬 미리보기 URL (FileReader)
- `coverImageFileName`: 업로드 후 서버 파일명
- `coverThumbnailUrl`: 업로드 후 썸네일 URL
- `selectedCoverTemplateUid`: 선택한 표지 템플릿 UID
- `selectedContentTemplateUid`: 선택한 내지 템플릿 UID
- `orderUid`: 주문 ID

---

## 라우터 구조 (App.jsx)

```
/                → Home
/type-select     → TypeSelect
/input-form      → InputForm
/loading         → Loading
/preview         → Preview
/order           → Order
/complete        → Complete
/shipping        → ShippingManager
```

---

## Tailwind 커스텀 색상 설정

> 프로젝트는 Tailwind CSS v4를 사용하므로 `tailwind.config.js` 대신 CSS 파일에 `@theme` 지시어로 정의

```css
/* src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: #2D6A4F;
  --color-primary-dark: #1B4332;
  --color-primary-light: #52B788;
}
```

사용 예시: `bg-primary`, `text-primary-dark`, `border-primary-light`

---

## 주문 상태 코드 상수

```javascript
const ORDER_STATUS = {
  20: '결제 완료',
  40: '제작 중',
  60: '발송 완료',
  70: '배송 완료',
  80: '취소됨'
}
```

---

## 페이지별 구현 상세

### Home.jsx

- 헤더: "GrowBook" 로고 (딥그린) + 우측 "배송지 관리" 링크 (`/shipping`)
- 메인 타이틀: "소중한 성장의 순간을 한 권의 책으로"
- 서브 타이틀: "AI가 한 해의 기억을 모아 특별한 앨범을 만들어드립니다"
- "앨범 만들기 시작" CTA 버튼 → `/type-select`
- 특징 카드 3개: "성장 기록" / "AI 스토리 생성" / "책 제작 & 배송"
- 이모티콘 없이 텍스트 + 아이콘만 사용

---

### TypeSelect.jsx

- 타이틀: "누구의 앨범을 만들까요?"
- 아이 성장 앨범 카드 (활성) — 클릭 시 딥그린 테두리 표시
- 반려동물 성장 앨범 카드 ("준비 중" 뱃지, 클릭 비활성)
- 선택 시 Context에 `type` 저장
- "다음" 버튼 → `/input-form`

---

### InputForm.jsx

- 이름, 태어난 연도, 앨범 연도 입력 필드
- 월별 하이라이트 1~12월 (2열 그리드)  
  placeholder: "이달의 특별한 순간을 적어주세요"
- "샘플로 체험하기" 버튼 → 더미 데이터 자동 입력  
  더미 (아이): 지호 / 2022 / 2025  
  - 1월: 처음으로 "엄마"라고 말했어요  
  - 3월: 어린이집을 시작했어요  
  - 5월: 자전거를 처음 탔어요  
  - 7월: 바다에서 처음 수영했어요  
  - 10월: 할로윈 파티에서 호박 분장을 했어요  
  - 12월: 산타할아버지를 처음 만났어요
- "다음" 버튼 → Context에 입력값 저장 → `/loading`

---

### Loading.jsx

> 스토리 생성 단일 단계만 처리. 책 생성(POST /api/books/create)은 Preview에서 모든 데이터 준비 후 호출.

**실행 단계:**

```
Step 1: POST /api/story/generate
  → 로딩 스피너 표시
  → 응답의 { title, subtitle, story } → generatedStory Context 저장
  → 완료 후 /preview 자동 이동
```

**에러 발생 시:**
- 실패 메시지 표시
- "다시 시도" 버튼 → 재호출

---

### Preview.jsx

2단 레이아웃 (좌: 표지 미리보기 / 우: 편집 영역)

**[좌측 - 표지 미리보기]**
- 선택한 표지 템플릿 썸네일 배경
- `coverThumbnailUrl` 있으면 표지에 이미지 표시
- 제목/부제 표지에 오버레이 표시

**[우측 - 편집 영역]**

**[표지 템플릿 선택]**
- 마운트 시 `GET /api/templates?kind=cover` 호출
- 템플릿 카드 그리드 (썸네일 + 이름)
- 선택 시 `selectedCoverTemplateUid` Context 저장
- 로딩 중 스켈레톤 UI 표시

**[내지 템플릿 선택]**
- 마운트 시 `GET /api/templates?kind=content` 호출
- 템플릿 카드 그리드 (썸네일 + 이름)
- 선택 시 `selectedContentTemplateUid` Context 저장
- 로딩 중 스켈레톤 UI 표시

**[표지 이미지 업로드]**
- `input[type=file]`로 이미지 선택
- FileReader로 로컬 미리보기 (`coverImagePreview`)
- "업로드" 클릭 시 `POST /api/books/:bookUid/upload-cover-image`  
  → 응답의 `thumbnailUrl` → `coverThumbnailUrl` Context 저장  
  → 응답의 `fileName` → `coverImageFileName` Context 저장

> 이미지 업로드는 bookUid가 필요하므로 "주문하기" 전에 POST /api/books/create가 먼저 호출되어야 함. 아래 "주문하기" 버튼 처리 참고.

**[앨범 제목]**
- 텍스트 표시 + [수정] [재생성] 버튼
- [수정]: 인풋창으로 전환, 저장 시 Context 업데이트
- [재생성]: `POST /api/story/generate` 재호출 → `title`만 교체 / 재생성 중 버튼 비활성화

**[부제]**
- 동일하게 [수정] [재생성]

**[AI 성장 스토리]**
- 스크롤 가능한 텍스트 박스
- [스토리 재생성] 버튼 → `POST /api/story/generate` 재호출 / 재생성 중 버튼 비활성화

**"주문하기" 버튼 처리 순서:**
1. `POST /api/books/create` 호출 (title, subtitle, story, selectedCoverTemplateUid, selectedContentTemplateUid, coverImageFileName, highlights 전달)  
   → `bookUid` Context 저장
2. 성공 시 `/order` 이동

> 표지 이미지 업로드(`POST /api/books/:bookUid/upload-cover-image`)는 bookUid가 필요하므로,  
> 이미지를 먼저 선택만 해두고 "주문하기" 클릭 시 books/create → upload-cover-image 순으로 처리하거나,  
> books/create를 Preview 진입 시점에 호출해 bookUid를 미리 확보하는 방식 중 선택.

---

### Order.jsx

마운트 시 자동 실행:
- `POST /api/orders/estimate` → 예상 금액 표시
- `GET /api/credits` → 잔액 표시

**금액 카드:**
- 상품 금액 / 배송비 / 포장비 / 총 결제 금액 (굵게 강조)

**배송지 탭:**

[저장된 배송지 탭]
- `localStorage` `shipping_addresses` 키에서 불러오기
- 라디오 버튼으로 선택
- "배송지 관리" 링크 (`/shipping`)
- 저장된 배송지 없으면 "저장된 배송지가 없습니다" 안내

[새 배송지 탭]
- 받는 사람, 전화번호, 우편번호, 주소, 상세주소, 배송 메모 입력
- "이 배송지 저장하기" 체크박스  
  → 체크 시 `localStorage` `shipping_addresses`에 추가  
  → 데이터 구조: `{ id, recipient_name, recipient_phone, postal_code, address1, address2, memo, is_default }`

**"주문 완료" 버튼:**
- `POST /api/orders` 호출
- 호출 중 버튼 비활성화
- 성공: `orderUid` Context 저장 → `/complete`
- 402 에러: 충전금 부족 모달 표시  
  → 필요금액 / 현재잔액 표시  
  → "파트너 포털에서 충전하기" 링크

---

### Complete.jsx

마운트 시 `GET /api/orders/:orderUid` 호출

**표시 정보:**
- 딥그린 원형 체크 아이콘
- "주문이 완료되었습니다"
- 주문 번호 (`orderUid`)
- 예상 배송일 (오늘 날짜 + 7일)
- 주문 상태 (`ORDER_STATUS` 상수로 한국어 변환)

"새 앨범 만들기" 버튼 → `/` (Context 전체 초기화)

---

### ShippingManager.jsx

`localStorage` `shipping_addresses` 기반 배송지 CRUD

**배송지 데이터 구조 (snake_case):**
```javascript
{
  id: Date.now(),
  recipient_name: string,
  recipient_phone: string,
  postal_code: string,
  address1: string,
  address2: string,
  memo: string,
  is_default: boolean
}
```

**기능:**
- 목록 표시 (기본 배송지 뱃지)
- [기본으로 설정]: `is_default` 토글
- [삭제]: `localStorage` 업데이트
- "+ 새 배송지 추가" 버튼 → 입력 폼 펼치기/접기
- [저장] [취소] 버튼

---

## 기타 조건

- 모든 API 호출은 `try-catch`로 에러 처리
- 로딩 중 버튼 비활성화
- 모바일 반응형 디자인
- 이모티콘 사용 금지
- 딥그린(`#2D6A4F`) Tailwind v4 `@theme` CSS 커스텀 색상 설정
- 단일 파일 또는 컴포넌트 분리 모두 가능
