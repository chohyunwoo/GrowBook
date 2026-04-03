# GrowBook (그로우북)

> 소중한 순간을 사진과 AI 감성 스토리로 담아 세상에 하나뿐인 포토북으로 만들어주는 서비스

---

## 서비스 소개

사진과 AI 감성 스토리로 세상에 하나뿐인 포토북을 만들어주는 서비스입니다.

**타겟**: 사진을 많이 찍고 공유하기 좋아하는 2030 여성 / 특별한 순간을 예쁘게 기록하고 싶은 사람

**포토북 타입**: 아이 성장 포토북 / 반려동물 포토북 / 여행 포토북 / 추억 포토북

### 주요 기능

- 📝 4가지 포토북 타입별 정보 입력
- 🖼️ 포토북 미리보기에서 사진 추가 및 특별한 순간 직접 입력
- 🤖 사용자 입력 기반 Claude AI 감성 스토리 자동 생성 (제목 + 부제 + 스토리)
- 📦 Sweetbook Book Print API로 실제 포토북 주문 및 배송
- 🎬 사진과 입력 내용으로 슬라이드쇼 영상 자동 생성 (배경음악 추가 가능)
- 🌐 한국어 / 영어 다국어 지원
- 👤 구글 로그인 및 주문 내역 조회

---

## 서비스 플로우

타입 선택 → 정보 입력 → 포토북 미리보기 (사진 추가 + 특별한 순간 입력 + AI 스토리 생성)
→ 포토북 생성 → 최종 포토북 확인 → 주문 → 완료

---

## 기술 스택

### 백엔드
- Node.js + Express (포트 3001)
- @anthropic-ai/sdk (Claude AI)
- Sweetbook Book Print API Node.js SDK
- multer (이미지 업로드)
- fluent-ffmpeg + sharp (슬라이드쇼 영상 생성)
- Supabase (주문 내역 저장)
- swagger-ui-express (API 문서)

### 프론트엔드
- React 18 + Vite (포트 5173)
- React Router v6
- React Context + useReducer (전역 상태)
- axios (HTTP 통신, timeout: 30000)
- Tailwind CSS
- react-i18next (다국어 지원, 한국어/영어)
- Supabase Auth (구글 로그인)

---

## 프로젝트 구조
growbook/
├── backend/
│   ├── src/
│   │   ├── sdk/                    # Book Print API SDK (직접 복사)
│   │   │   ├── client.js
│   │   │   └── core.js
│   │   ├── routes/
│   │   │   ├── story.js            # Claude AI 스토리 생성
│   │   │   ├── books.js            # 책 생성 API
│   │   │   ├── orders.js           # 주문 API
│   │   │   ├── templates.js        # 템플릿 API
│   │   │   └── video.js            # 슬라이드쇼 영상 생성 API
│   │   ├── services/
│   │   │   ├── claudeService.js    # Claude API 호출
│   │   │   ├── sweetbookService.js # Book Print SDK 호출
│   │   │   ├── videoService.js     # FFmpeg 영상 생성
│   │   │   └── supabaseService.js  # Supabase 연동
│   │   ├── middlewares/
│   │   │   └── asyncHandler.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── context/
│   │   │   └── AppContext.jsx      # 전역 상태
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── TypeSelect.jsx
│   │   │   ├── InputForm.jsx
│   │   │   ├── Preview.jsx
│   │   │   ├── Loading.jsx
│   │   │   ├── AlbumView.jsx
│   │   │   ├── Order.jsx
│   │   │   ├── Complete.jsx
│   │   │   ├── MyPage.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── ShippingManager.jsx
│   │   │   ├── Terms.jsx
│   │   │   └── Privacy.jsx
│   │   ├── components/
│   │   │   ├── LanguageSwitcher.jsx # 언어 전환 컴포넌트
│   │   │   └── Footer.jsx
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── storyApi.js
│   │   │   ├── bookApi.js
│   │   │   ├── orderApi.js
│   │   │   ├── templateApi.js
│   │   │   └── videoApi.js         # 영상 생성 API
│   │   ├── data/
│   │   │   └── sampleStories.js    # 샘플 체험 데이터
│   │   ├── locales/
│   │   │   ├── ko/common.json      # 한국어 번역
│   │   │   └── en/common.json      # 영어 번역
│   │   ├── lib/
│   │   │   ├── i18n.js             # 다국어 초기화
│   │   │   └── supabase.js
│   │   └── App.jsx
│   ├── .env.example
│   └── package.json
│
└── dummy-data/
└── child-stories.json

---

## 실행 방법

### 사전 준비

- Node.js 18 이상
- Sweetbook Sandbox API Key ([api.sweetbook.com](https://api.sweetbook.com) 가입 후 발급)
- Anthropic API Key ([console.anthropic.com](https://console.anthropic.com))
- Supabase 프로젝트 ([supabase.com](https://supabase.com))
- FFmpeg 설치 (슬라이드쇼 영상 생성 기능에 필요)
  - Windows: `winget install ffmpeg`
  - Mac: `brew install ffmpeg`

### 설치
```bash
# SDK 설치 (npm 패키지가 아닌 파일 직접 복사 방식)
git clone https://github.com/sweet-book/bookprintapi-nodejs-sdk
cp bookprintapi-nodejs-sdk/lib/client.js backend/src/sdk/
cp bookprintapi-nodejs-sdk/lib/core.js backend/src/sdk/

# 백엔드 패키지 설치
cd backend
npm install

# 프론트엔드 패키지 설치
cd ../frontend
npm install
```

### 환경변수 설정
```bash
# 백엔드 환경변수
cd backend
touch .env
```
```env
# backend/.env
NODE_ENV=development
PORT=3001
SWEETBOOK_API_KEY=your_sweetbook_sandbox_key
SWEETBOOK_BASE_URL=https://api-sandbox.sweetbook.com
ANTHROPIC_API_KEY=your_anthropic_api_key
ALLOWED_ORIGIN=http://localhost:5173
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
```
```bash
# 프론트엔드 환경변수
cd frontend
cp .env.example .env
```
```env
# frontend/.env
VITE_API_BASE_URL=http://localhost:3001
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 실행
```bash
# 백엔드 실행 (포트 3001)
cd backend
npm run dev

# 프론트엔드 실행 (포트 5173)
cd frontend
npm run dev
```

브라우저에서 접속: **http://localhost:5173**

실행 성공 시 (백엔드):
 환경변수 확인 완료
서버가 3001번 포트에서 실행 중입니다
📄 API 문서: http://localhost:3001/api-docs
---

## 사용한 API 목록

| API | 용도 |
|-----|------|
| POST /books | 새 포토북 생성 (이미지 포함) |
| GET /templates | 표지 템플릿 목록 조회 |
| POST /orders/estimate | 주문 예상 금액 조회 |
| POST /orders | 주문 생성 |
| GET /orders/my | 내 주문 목록 조회 |
| GET /orders/:orderUid | 주문 상태 조회 |
| POST /orders/:orderUid/cancel | 주문 취소 |
| GET /credits | 잔액 조회 |

---

## 샘플 체험

로그인 없이 샘플 데이터로 서비스를 체험할 수 있습니다.

정보 입력 페이지에서 **"샘플로 체험하기"** 버튼을 클릭하면
더미 데이터가 자동으로 입력됩니다.

더미 데이터 위치: `dummy-data/child-stories.json`

---

## 주문 상태 코드

| 코드 | 상태 |
|------|------|
| 20 | 결제 완료 (PAID) |
| 40 | 제작 중 (IN_PRODUCTION) |
| 60 | 발송 완료 (SHIPPED) |
| 70 | 배송 완료 (DELIVERED) |
| 80 | 취소 (CANCELLED) |

---

## Supabase 설정

## Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. Google OAuth 활성화
   - Authentication → Providers → Google 클릭
   - Google Cloud Console에서 OAuth 클라이언트 ID 발급
   - Client ID, Client Secret 입력 후 저장
   - Redirect URL을 Google Cloud Console에 등록
3. 아래 SQL로 orders 테이블 생성
...
3. 아래 SQL로 orders 테이블 생성:
```sql
create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  order_uid text not null,
  album_title text,
  album_type text,
  status integer default 20,
  ordered_at timestamp with time zone default now()
);

alter table orders enable row level security;

create policy "Users can view own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own orders"
  on orders for update
  using (auth.uid() = user_id);
```

---

## 개발 환경

- Node.js 18+
- npm 9+
- 포트: 백엔드 3001 / 프론트엔드 5173

---

## 법적 고지

- 이용약관: 서비스 내 `/terms` 페이지 참조
- 개인정보처리방침: 서비스 내 `/privacy` 페이지 참조

---

## AI 도구 사용 내역

| AI 도구 | 활용 내용 |
|---------|----------|
| Claude Desktop | 기획 및 설계 |
| Claude Code | 백엔드 API 라우팅 구조 설계, claudeService.js 작성 |
| Claude (claude.ai) | 더미 데이터 생성, 에러 디버깅 |

---

## 설계 의도

### 왜 이 서비스를 선택했는가

일상에서 사진은 넘쳐나지만, 그것을 하나의 '이야기'로 엮어 실물로 남기는 경험은 드뭅니다.
AI가 자동으로 감성 스토리를 써주고, 사용자가 직접 사진을 고르고 다듬어 자신만의 책을 만드는 경험은
특별한 날의 선물이 되고, 시간이 지나도 다시 꺼내보고 싶은 추억이 된다고 생각했습니다.

### 비즈니스 가능성

- SNS 공유 기능을 추가하면 '특별한 날 선물하고 싶은 책'으로 자연스럽게 인식되어 바이럴 마케팅 효과를 기대할 수 있음
- 인플루언서·아이돌 팬미팅 굿즈로 활용되면 강력한 마케팅 채널이 될 수 있음

### 더 시간이 있었다면 추가했을 기능

- 앨범 공유 링크 기능
- 사진 자동 레이아웃 배치 AI
- 정기 구독 플랜 (매월 자동 포토북 생성)
