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
- 🛒 포토북 수량 선택 기능 (1~10권, 부가세 포함 금액 표시)
- 🎬 사진과 입력 내용으로 슬라이드쇼 영상 자동 생성 (배경음악 추가 가능)
- 🔗 결제 완료 후 포토북 공유 링크 생성 (30일 유효, 로그인 없이 접근 가능)
- 👥 포토북 커뮤니티 (게시글 작성, 좋아요, 댓글, 이미지 첨부)
- ⭐ 포토북 리뷰 및 별점 기능 (배송 완료 후 작성)
- 🌐 한국어 / 영어 다국어 지원
- 👤 구글 로그인 및 주문 내역 조회
- 📮 카카오 주소 검색 연동 배송지 관리 및 변경
- 🔐 관리자 페이지 (충전금 잔액, 전체 주문 현황, 상태별 통계 그래프, 커뮤니티/리뷰 관리)

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
- Supabase (사용자 및 주문 내역 저장)
- swagger-ui-express (API 문서)

### 프론트엔드
- React 18 + Vite (포트 5173)
- React Router v6
- React Context + useReducer (전역 상태)
- axios (HTTP 통신, timeout: 30000)
- Tailwind CSS
- react-i18next (다국어 지원, 한국어/영어)
- Supabase Auth (구글 로그인)
- 카카오 우편번호 서비스 (배송지 검색)


---

## 프로젝트 구조
```
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
│   │   │   ├── video.js            # 슬라이드쇼 영상 생성 API
│   │   │   ├── admin.js            # 관리자 API
│   │   │   ├── share.js            # 공유 링크 API
│   │   │   ├── community.js        # 커뮤니티 API
│   │   │   └── reviews.js          # 리뷰 API
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
│   │   │   ├── Admin.jsx           # 관리자 페이지
│   │   │   ├── SharedAlbum.jsx     # 공유 앨범 페이지
│   │   │   ├── Community.jsx       # 커뮤니티 페이지
│   │   │   ├── CommunityPost.jsx   # 커뮤니티 게시글 상세
│   │   │   ├── ReviewPost.jsx      # 리뷰 상세 페이지
│   │   │   ├── Terms.jsx
│   │   │   └── Privacy.jsx
│   │   ├── components/
│   │   │   ├── LanguageSwitcher.jsx # 언어 전환 컴포넌트
│   │   │   └── Footer.jsx
│   |   |   └── ProtectedRoute.jsx
│   │   ├── api/
│   │   │   ├── client.js
│   │   │   ├── storyApi.js
│   │   │   ├── bookApi.js
│   │   │   ├── orderApi.js
│   │   │   ├── templateApi.js
│   │   │   ├── videoApi.js         # 영상 생성 API
│   │   │   ├── adminApi.js         # 관리자 API
│   │   │   ├── shareApi.js         # 공유 링크 API
│   │   │   ├── communityApi.js     # 커뮤니티 API
│   │   │   └── reviewApi.js        # 리뷰 API
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
```

## 실행 방법

### 사전 준비

- Node.js 18 이상
- Sweetbook Sandbox API Key ([api.sweetbook.com](https://api.sweetbook.com) 가입 후 발급)
- Anthropic API Key ([console.anthropic.com](https://console.anthropic.com))
- Supabase 프로젝트 ([supabase.com](https://supabase.com))
- FFmpeg 설치 (슬라이드쇼 영상 생성 기능에 필요)
  - Windows: `winget install ffmpeg`
  - Mac: `brew install ffmpeg`
  - 설치 확인: `ffmpeg -version`

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
```
[server] http://localhost:3001 에서 실행 중
[docs]   http://localhost:3001/api-docs
```

## 사용한 API 목록

### Books API

| API | 용도 |
|-----|------|
| POST /books | 새 포토북 생성 → bookUid 발급 |
| POST /books/{bookUid}/photos | 표지/내지 이미지 업로드 |
| POST /books/{bookUid}/cover | 표지 템플릿 적용 및 표지 생성 |
| POST /books/{bookUid}/contents | 내지 페이지 삽입 (스토리, 하이라이트, 빈 페이지) |
| POST /books/{bookUid}/finalization | 도서 최종화 (편집 완료 확정) |

### Orders API

| API | 용도 |
|-----|------|
| POST /orders/estimate | 주문 예상 금액 조회 |
| POST /orders | 주문 생성 (배송 정보 포함) |
| GET /orders/{orderUid} | 주문 상태 조회 |
| POST /orders/{orderUid}/cancel | 주문 취소 |
| PATCH /orders/{orderUid}/shipping | 배송지 변경 |

### Credits API

| API | 용도 |
|-----|------|
| GET /credits | 충전금 잔액 조회 |

---

## 샘플 체험

정보 입력 페이지에서 **"샘플로 체험하기"** 버튼을 클릭하면
더미 데이터가 자동으로 입력됩니다.

> ⚠️ 서비스 이용을 위해 구글 로그인이 필요합니다.
> Supabase Google OAuth 설정이 완료되어야 로그인이 가능합니다.

더미 데이터 위치: `dummy-data/child-stories.json`
---

## 주문 상태 코드

| 코드 | 상태 |
|------|------|
| 20 | 결제 완료 (PAID) |
| 25 | PDF 제작 완료 (PDF_READY) |
| 30 | 주문 확정 (CONFIRMED) |
| 40 | 제작 중 (IN_PRODUCTION) |
| 50 | 제작 완료 (PRODUCTION_COMPLETE) |
| 60 | 배송 중 (SHIPPED) |
| 70 | 배송 완료 (DELIVERED) |
| 80 | 주문 취소 (CANCELLED) |
| 81 | 취소 및 환불 (CANCELLED_REFUND) |


---

## Supabase 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성

2. Google OAuth 활성화
   - Authentication → Providers → Google 클릭
   - [Google Cloud Console](https://console.cloud.google.com)에서 OAuth 2.0 클라이언트 ID 발급
     - APIs & Services → Credentials → Create Credentials → OAuth Client ID
     - Application Type: Web Application
     - Authorized redirect URIs에 Supabase Callback URL 추가:
       `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - Supabase Google Provider에 Client ID, Client Secret 입력 후 저장

3. Storage 버킷 생성:
   - Supabase 대시보드 → Storage → New Bucket
   - `community-images` (Public: ON)
   - `review-images` (Public: ON)

4. 아래 SQL로 테이블 생성:
```sql
-- orders 테이블
create table orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  order_uid text not null,
  album_title text,
  album_type text,
  status integer default 20,
  quantity integer default 1,
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

-- profiles 테이블 (구글 로그인 사용자 정보 저장)
create table profiles (
  id uuid references auth.users(id) primary key,
  email text,
  name text,
  avatar_url text,
  is_admin boolean default false,
  created_at timestamp with time zone default now()
);

alter table profiles enable row level security;

create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- shared_albums 테이블 (공유 링크)
create table shared_albums (
  id uuid default gen_random_uuid() primary key,
  share_code text unique not null,
  user_id uuid references auth.users(id),
  order_uid text,
  title text,
  subtitle text,
  story text,
  album_type text,
  created_at timestamp with time zone default now(),
  expires_at timestamp with time zone default (now() + interval '30 days')
);

alter table shared_albums enable row level security;

create policy "Anyone can view shared albums"
  on shared_albums for select
  using (expires_at > now());

create policy "Users can insert own shared albums"
  on shared_albums for insert
  with check (auth.uid() = user_id);

-- community_posts 테이블
create table community_posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  author_name text,
  title text not null,
  content text,
  album_type text,
  rating integer check (rating >= 1 and rating <= 5),
  order_uid text,
  likes integer default 0,
  image_urls text[],
  created_at timestamp with time zone default now()
);

alter table community_posts enable row level security;

create policy "Anyone can view posts"
  on community_posts for select using (true);

create policy "Users can insert own posts"
  on community_posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update own posts"
  on community_posts for update
  using (auth.uid() = user_id);

create policy "Users can delete own posts"
  on community_posts for delete
  using (auth.uid() = user_id);

-- community_comments 테이블
create table community_comments (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references community_posts(id) on delete cascade,
  user_id uuid references auth.users(id),
  author_name text,
  content text not null,
  created_at timestamp with time zone default now()
);

alter table community_comments enable row level security;

create policy "Anyone can view comments"
  on community_comments for select using (true);

create policy "Users can insert own comments"
  on community_comments for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own comments"
  on community_comments for delete
  using (auth.uid() = user_id);

-- community_post_likes 테이블
create table community_post_likes (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references community_posts(id) on delete cascade,
  user_id uuid references auth.users(id),
  created_at timestamp with time zone default now(),
  unique(post_id, user_id)
);

alter table community_post_likes enable row level security;

create policy "Anyone can view post likes"
  on community_post_likes for select using (true);

create policy "Users can insert own likes"
  on community_post_likes for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own likes"
  on community_post_likes for delete
  using (auth.uid() = user_id);

-- reviews 테이블
create table reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id),
  order_uid text not null unique,
  rating integer not null check (rating >= 1 and rating <= 5),
  content text,
  image_urls text[],
  created_at timestamp with time zone default now()
);

alter table reviews enable row level security;

create policy "Anyone can view reviews"
  on reviews for select using (true);

create policy "Users can insert own reviews"
  on reviews for insert
  with check (auth.uid() = user_id);

-- 구글 로그인 시 profiles 테이블에 자동 저장하는 트리거
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- 기존 사용자 profiles 테이블에 수동 추가
insert into public.profiles (id, email, name, avatar_url)
select
  id,
  email,
  raw_user_meta_data->>'full_name',
  raw_user_meta_data->>'avatar_url'
from auth.users
on conflict (id) do nothing;

-- 관리자 계정 설정 (본인 이메일로 변경)
update profiles set is_admin = true
where email = 'your_admin_email@gmail.com';
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

국내 포토북 시장은 꾸준히 성장하고 있으며, 기존 서비스(스냅스, 포토몬 등)는
사용자가 직접 레이아웃을 편집해야 하는 진입 장벽이 있습니다.
GrowBook은 AI가 스토리와 캡션을 자동 생성해주어 누구나 쉽게
감성적인 포토북을 만들 수 있다는 점에서 차별화됩니다.

- **반복 구매 모델**: 아이 성장 포토북은 매년 구매가 발생하는 구조로
  구독형 서비스로 확장 가능
- **바이럴 마케팅**: SNS 공유 기능 추가 시 '특별한 날 선물하고 싶은 책'으로
  자연스럽게 인식되어 바이럴 효과 기대
- **B2B 확장**: 인플루언서·아이돌 팬미팅 굿즈, 유치원·어린이집 졸업 앨범 등
  B2B 채널로 확장 가능

### 더 시간이 있었다면 추가했을 기능

- 쿠폰 / 할인 코드 기능 (특별 할인 이벤트, 첫 구매 할인 등)
- 포토북 수량 다중 할인 적용 (2권 이상 주문 시 할인)
- 슬라이드쇼 영상 유료화 (현재는 포토북 미리보기 단계에서 무료 제공, 실제 서비스에서는 주문 완료 후에만 다운로드 가능하도록 개선 필요)
- 관리자 페이지 고도화 (주문 상태 변경 — Sweetbook 파트너 API 제한으로 미구현)

### 시연 영상

[🎬 시연 영상 보기](https://drive.google.com/file/d/1qKIw3dRKHO19wjDWsGEiEwd9j4_r52Xk/view?usp=sharing)
