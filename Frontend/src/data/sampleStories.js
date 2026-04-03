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
    birthYear: '2026.03.01 - 2026.03.05',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '2026 도쿄 여행',
    birthYear: '2026.01.10 - 2026.01.14',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '2025 부산 여름 여행',
    birthYear: '2025.08.01 - 2025.08.03',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
]

const memorySamplesKo = [
  {
    name: '아버지',
    birthYear: '1990~2025년',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '우리 가족',
    birthYear: '2000~2025년',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '할머니',
    birthYear: '1980~2024년',
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
    birthYear: '2026.03.01 - 2026.03.05',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '2026 Tokyo Trip',
    birthYear: '2026.01.10 - 2026.01.14',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: '2025 Busan Summer Trip',
    birthYear: '2025.08.01 - 2025.08.03',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
]

const memorySamplesEn = [
  {
    name: 'Father',
    birthYear: '1990–2025',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: 'Our Family',
    birthYear: '2000–2025',
    albumYear: CURRENT_YEAR,
    highlights: emptyHighlights(),
  },
  {
    name: 'Grandmother',
    birthYear: '1980–2024',
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
