const CURRENT_YEAR = String(new Date().getFullYear())

function emptyHighlights() {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    content: '',
  }))
}

// ── Korean ──────────────────────────────────────────────

const childSamplesKo = [
  {
    name: '지호',
    birthYear: '2022',
    albumYear: '2025',
    highlights: emptyHighlights(),
  },
  {
    name: '서연',
    birthYear: '2021',
    albumYear: '2025',
    highlights: emptyHighlights(),
  },
  {
    name: '민준',
    birthYear: '2023',
    albumYear: '2025',
    highlights: emptyHighlights(),
  },
]

const petSamplesKo = [
  {
    name: '코코',
    birthYear: '2021',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '보리',
    birthYear: '2020',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '나비',
    birthYear: '2022',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
]

const travelSamplesKo = [
  {
    name: '2026 제주도 봄 여행',
    startPeriod: '2026-03',
    endPeriod: '2026-03',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '2026 도쿄 여행',
    startPeriod: '2026-01',
    endPeriod: '2026-01',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '2025 부산 여름 여행',
    startPeriod: '2025-08',
    endPeriod: '2025-08',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
]

const memorySamplesKo = [
  {
    name: '아버지',
    startPeriod: '1990',
    endPeriod: '2025',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '우리 가족',
    startPeriod: '2000',
    endPeriod: '2025',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '할머니',
    startPeriod: '1980',
    endPeriod: '2024',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
]

// ── English ─────────────────────────────────────────────

const childSamplesEn = [
  {
    name: 'Jiho',
    birthYear: '2022',
    albumYear: '2025',
    highlights: emptyHighlights(),
  },
  {
    name: 'Seoyeon',
    birthYear: '2021',
    albumYear: '2025',
    highlights: emptyHighlights(),
  },
  {
    name: 'Minjun',
    birthYear: '2023',
    albumYear: '2025',
    highlights: emptyHighlights(),
  },
]

const petSamplesEn = [
  {
    name: 'Coco',
    birthYear: '2021',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: 'Bori',
    birthYear: '2020',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: 'Nabi',
    birthYear: '2022',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
]

const travelSamplesEn = [
  {
    name: '2026 Jeju Island Spring Trip',
    startPeriod: '2026-03',
    endPeriod: '2026-03',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '2026 Tokyo Trip',
    startPeriod: '2026-01',
    endPeriod: '2026-01',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '2025 Busan Summer Trip',
    startPeriod: '2025-08',
    endPeriod: '2025-08',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
]

const memorySamplesEn = [
  {
    name: 'Father',
    startPeriod: '1990',
    endPeriod: '2025',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: 'Our Family',
    startPeriod: '2000',
    endPeriod: '2025',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: 'Grandmother',
    startPeriod: '1980',
    endPeriod: '2024',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
]

// ── Export ───────────────────────────────────────────────

export const sampleStories = {
  ko: {
    child: childSamplesKo,
    pet: petSamplesKo,
    travel: travelSamplesKo,
    memory: memorySamplesKo,
  },
  en: {
    child: childSamplesEn,
    pet: petSamplesEn,
    travel: travelSamplesEn,
    memory: memorySamplesEn,
  },
}

export function getSample(type, lang = 'ko') {
  const stories = sampleStories[lang] || sampleStories.ko
  const list = stories[type] || stories.child
  return list[Math.floor(Math.random() * list.length)]
}

export default childSamplesKo
