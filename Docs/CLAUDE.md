# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GrowBook** is a Korean-language full-stack web app for creating personalized child growth photo albums. It generates AI stories (Claude API) and produces physical printed books (Sweetbook API).

## Development Commands

### Frontend (`/Frontend`)

```bash
npm install       # Install dependencies
npm run dev       # Dev server → http://localhost:5173
npm run build     # Production build → ./dist/
npm run preview   # Serve production build locally
npm run lint      # ESLint (flat config, JS/JSX)
```

### Backend (`/Backend`)

The backend is not yet scaffolded — full spec is in `/Docs/backend-spec.md`. The Sweetbook SDK (`client.js`, `core.js`) is already written.

## Environment Variables

**`/Backend/.env`**
```
ANTHROPIC_API_KEY=
SWEETBOOK_API_KEY=
SWEETBOOK_BASE_URL=https://api-sandbox.sweetbook.com
ALLOWED_ORIGIN=http://localhost:5173
PORT=3000
```

**`/Frontend/.env`**
```
VITE_API_BASE_URL=http://localhost:3000
```

## Architecture

### Frontend Structure (planned per spec)

```
Frontend/src/
├── api/
│   ├── client.js          # axios instance (baseURL from VITE_API_BASE_URL, timeout: 30000)
│   ├── storyApi.js        # POST /api/story/generate
│   ├── bookApi.js         # POST /api/books/create, upload-cover-image
│   ├── orderApi.js        # estimate, create, get
│   └── templateApi.js     # GET /api/templates
├── context/
│   └── AppContext.jsx      # Global state via Context + useReducer
├── pages/                 # Route-level components
└── components/            # Shared UI components
```

### Global State (AppContext)

Managed with `Context + useReducer`. Fields:
- `type`, `name`, `birthYear`, `albumYear`
- `highlights`: `[{ month: 1–12, content: string }]` (12 fixed entries)
- `generatedStory`: `{ title, subtitle, story }` from Claude
- `bookUid`: Sweetbook book ID
- `coverImageFile`, `coverImagePreview`, `coverImageFileName`, `coverThumbnailUrl`
- `selectedCoverTemplateUid`, `selectedContentTemplateUid`
- `orderUid`

### Page Flow & Routes

| Route | Page | Key behavior |
|---|---|---|
| `/` | Home | CTA → `/type-select` |
| `/type-select` | TypeSelect | Set `type` in Context → `/input-form` |
| `/input-form` | InputForm | Set name/year/highlights → `/loading` |
| `/loading` | Loading | Calls `POST /api/story/generate` → auto-navigate to `/preview` |
| `/preview` | Preview | Load templates, edit cover/story, "주문하기" calls `POST /api/books/create` → `/order` |
| `/order` | Order | Estimate + credits on mount; shipping from localStorage; `POST /api/orders` → `/complete` |
| `/complete` | Complete | `GET /api/orders/:orderUid`; "새 앨범 만들기" resets Context → `/` |
| `/shipping` | ShippingManager | CRUD for `localStorage` key `shipping_addresses` |

> **Note:** `App.jsx` currently has old routes (`/upload`, `/edit-cover`). These should be replaced with the routes above per the spec.

### Tailwind CSS v4 Custom Colors

No `tailwind.config.js` — colors are defined in `src/index.css` using `@theme`:

```css
@import "tailwindcss";

@theme {
  --color-primary: #2D6A4F;
  --color-primary-dark: #1B4332;
  --color-primary-light: #52B788;
}
```

Use as: `bg-primary`, `text-primary-dark`, `border-primary-light`.

### axios Client

```javascript
// src/api/client.js
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 30000  // Claude generation can take >30s
})
// Intercepts 402 → rejects with { type: 'INSUFFICIENT_CREDIT', required, balance }
```

### Backend (planned)

**Middleware chain:** `helmet` → `morgan` → `cors` (ALLOWED_ORIGIN) → `express.json({ limit: '1mb' })` → `express-rate-limit` → routes → global error handler

**API endpoints** (see `/Docs/backend-spec.md` for full contracts):
- `POST /api/story/generate` — Claude AI; rate limit 10/15min; validates name/birthYear/albumYear/highlights
- `POST /api/books/create` — 5-step Sweetbook pipeline (create → cover → story content → 12 monthly contents → finalize)
- `POST /api/books/:bookUid/upload-cover-image` — multer, max 20MB
- `GET /api/templates?kind=cover|content`
- `POST /api/orders/estimate`, `POST /api/orders`, `GET /api/orders/:orderUid`
- `GET /api/credits`

**Sweetbook SDK** (already implemented in `Backend/`):
- `client.js` — 7 clients: `BooksClient`, `PhotosClient`, `CoversClient`, `ContentsClient`, `OrdersClient`, `CreditsClient`, `SweetbookClient`
- `core.js` — `BaseClient` HTTP layer, `ResponseParser`, error classes (`SweetbookApiError`, `NetworkError`, `ValidationError`)

**Consistent response format:**
```json
{ "success": true, "data": { ... } }
{ "success": false, "error": "ERROR_CODE", "message": "한국어 메시지" }
```
Error codes: `INVALID_INPUT`, `INSUFFICIENT_CREDIT`, `CLAUDE_API_ERROR`, `SWEETBOOK_API_ERROR`, `FILE_TYPE_NOT_ALLOWED`, `FILE_SIZE_EXCEEDED`

### Order Status Constants

```javascript
const ORDER_STATUS = { 20: '결제 완료', 40: '제작 중', 60: '발송 완료', 70: '배송 완료', 80: '취소됨' }
```

## Key Conventions

- All UI text is in Korean; no emoji in UI
- All API calls use `try-catch`; disable buttons during loading
- Shipping addresses stored in `localStorage` under key `shipping_addresses` (snake_case fields: `recipient_name`, `recipient_phone`, `postal_code`, `address1`, `address2`, `memo`, `is_default`, `id: Date.now()`)
- `axios` must be added to `Frontend/package.json` dependencies (not yet present)
- ESLint rule: `no-unused-vars` ignores capitalized names (React component pattern)
