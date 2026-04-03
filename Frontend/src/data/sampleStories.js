const CURRENT_YEAR = String(new Date().getFullYear())

function makeHighlights(entries) {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    content: entries[i + 1] || '',
  }))
}

function makeMoments(items) {
  const highlights = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    content: items[i]?.content || '',
  }))
  return highlights
}

// ── Korean ──────────────────────────────────────────────

const childSamplesKo = [
  {
    name: '지호',
    birthYear: '2022',
    albumYear: '2025',
    highlights: makeHighlights({
      1: '처음으로 엄마라고 말했어요',
      3: '어린이집을 시작했어요',
      5: '자전거를 처음 탔어요',
      7: '바다에서 처음 수영했어요',
      10: '할로윈 파티에서 호박 분장을 했어요',
      12: '산타할아버지를 처음 만났어요',
    }),
  },
  {
    name: '서연',
    birthYear: '2021',
    albumYear: '2025',
    highlights: makeHighlights({
      2: '처음으로 혼자 밥을 먹었어요',
      4: '유치원 친구를 사귀었어요',
      6: '수영장을 무서워하지 않게 됐어요',
      8: '할머니 댁에서 텃밭을 가꿨어요',
      9: '처음으로 그림일기를 썼어요',
      11: '피아노 발표회에서 연주했어요',
    }),
  },
  {
    name: '민준',
    birthYear: '2023',
    albumYear: '2025',
    highlights: makeHighlights({
      1: '처음으로 뒤집기 성공했어요',
      3: '이가 처음 났어요',
      5: '혼자 앉기 시작했어요',
      7: '처음으로 기어다니기 시작했어요',
      9: '붙잡고 서기 성공했어요',
      12: '첫 걸음마를 떼었어요',
    }),
  },
]

const petSamplesKo = [
  {
    name: '코코',
    birthYear: '2021',
    albumYear: CURRENT_YEAR,
    highlights: makeHighlights({
      1: '처음으로 공원 산책을 했어요',
      3: '목욕을 처음으로 했어요',
      5: '친구 강아지를 처음 만났어요',
      7: '바다에서 처음 수영했어요',
      9: '앉아 훈련을 완료했어요',
      12: '크리스마스 선물을 받았어요',
    }),
  },
  {
    name: '보리',
    birthYear: '2020',
    albumYear: CURRENT_YEAR,
    highlights: makeHighlights({
      2: '처음으로 어질리티 훈련을 시작했어요',
      4: '공원에서 프리스비를 배웠어요',
      6: '수영장에서 신나게 놀았어요',
      8: '캠핑을 처음 갔어요',
      10: '도그쇼에 참가했어요',
      12: '처음으로 눈밭을 뛰어다녔어요',
    }),
  },
  {
    name: '나비',
    birthYear: '2022',
    albumYear: CURRENT_YEAR,
    highlights: makeHighlights({
      1: '처음으로 캣타워에 올라갔어요',
      3: '새 장난감에 푹 빠졌어요',
      6: '창가에서 새 구경하는 걸 좋아해요',
      8: '처음으로 목욕을 했어요',
      10: '집사를 졸졸 따라다니기 시작했어요',
      12: '크리스마스 트리를 건드렸어요',
    }),
  },
]

const travelSamplesKo = [
  {
    name: '2026 제주도 봄 여행',
    birthYear: '2026.03.01 - 2026.03.05',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: '한라산 등반에 성공했어요' },
      { content: '성산일출봉에서 일출을 봤어요' },
      { content: '우도에서 자전거를 탔어요' },
      { content: '흑돼지 맛집을 발견했어요' },
      { content: '협재 해변에서 노을을 봤어요' },
    ]),
  },
  {
    name: '2026 도쿄 여행',
    birthYear: '2026.01.10 - 2026.01.14',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: '아사쿠사 센소지 사원을 방문했어요' },
      { content: '시부야 스크램블 교차로를 걸었어요' },
      { content: '츠키지 시장에서 초밥을 먹었어요' },
      { content: '하라주쿠에서 쇼핑을 했어요' },
      { content: '도쿄 스카이트리에 올라갔어요' },
    ]),
  },
  {
    name: '2025 부산 여름 여행',
    birthYear: '2025.08.01 - 2025.08.03',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: '해운대 해수욕장에서 수영했어요' },
      { content: '감천문화마을을 구경했어요' },
      { content: '광안대교 야경을 감상했어요' },
    ]),
  },
]

const memorySamplesKo = [
  {
    name: '아버지',
    birthYear: '1990~2025년',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: '아버지가 자전거 타는 법을 가르쳐 주셨어요' },
      { content: '매년 여름 함께 강가에서 낚시를 했어요' },
      { content: '졸업식에서 아버지가 꽃다발을 주셨어요' },
      { content: '함께 제주도 여행을 다녀왔어요' },
    ]),
  },
  {
    name: '우리 가족',
    birthYear: '2000~2025년',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: '온 가족이 함께 경주로 여행을 갔어요' },
      { content: '매년 추석마다 할머니 댁에 모였어요' },
      { content: '20주년 기념으로 가족 사진을 찍었어요' },
      { content: '매주 일요일 온 가족이 함께 밥을 먹었어요' },
    ]),
  },
  {
    name: '할머니',
    birthYear: '1980~2024년',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: '어릴 때 할머니 손을 잡고 시장을 다녔어요' },
      { content: '할머니가 만들어 주신 김치찌개가 그리워요' },
      { content: '할머니 텃밭에서 채소를 키웠어요' },
      { content: '할머니의 80번째 생신을 함께 축하했어요' },
    ]),
  },
]

// ── English ─────────────────────────────────────────────

const childSamplesEn = [
  {
    name: 'Jiho',
    birthYear: '2022',
    albumYear: '2025',
    highlights: makeHighlights({
      1: 'Said "Mama" for the very first time',
      3: 'Started going to daycare',
      5: 'Rode a bicycle for the first time',
      7: 'Went swimming in the ocean for the first time',
      10: 'Dressed up as a pumpkin for Halloween',
      12: 'Met Santa Claus for the first time',
    }),
  },
  {
    name: 'Seoyeon',
    birthYear: '2021',
    albumYear: '2025',
    highlights: makeHighlights({
      2: 'Ate a meal all by herself for the first time',
      4: 'Made a new friend at kindergarten',
      6: 'Got over the fear of the swimming pool',
      8: 'Tended a garden at Grandma\'s house',
      9: 'Wrote a picture diary for the first time',
      11: 'Performed at a piano recital',
    }),
  },
  {
    name: 'Minjun',
    birthYear: '2023',
    albumYear: '2025',
    highlights: makeHighlights({
      1: 'Rolled over for the very first time',
      3: 'Got his first tooth',
      5: 'Started sitting up on his own',
      7: 'Started crawling for the first time',
      9: 'Pulled himself up to stand',
      12: 'Took his very first steps',
    }),
  },
]

const petSamplesEn = [
  {
    name: 'Coco',
    birthYear: '2021',
    albumYear: CURRENT_YEAR,
    highlights: makeHighlights({
      1: 'Went on a walk in the park for the first time',
      3: 'Had a bath for the very first time',
      5: 'Met another puppy friend for the first time',
      7: 'Went swimming in the ocean for the first time',
      9: 'Completed sit training',
      12: 'Got a Christmas present',
    }),
  },
  {
    name: 'Bori',
    birthYear: '2020',
    albumYear: CURRENT_YEAR,
    highlights: makeHighlights({
      2: 'Started agility training for the first time',
      4: 'Learned to catch a frisbee at the park',
      6: 'Had a blast playing in the pool',
      8: 'Went camping for the first time',
      10: 'Participated in a dog show',
      12: 'Ran through the snow for the first time',
    }),
  },
  {
    name: 'Nabi',
    birthYear: '2022',
    albumYear: CURRENT_YEAR,
    highlights: makeHighlights({
      1: 'Climbed the cat tower for the first time',
      3: 'Fell in love with a new toy',
      6: 'Loves watching birds from the windowsill',
      8: 'Had a bath for the very first time',
      10: 'Started following their human everywhere',
      12: 'Knocked over the Christmas tree',
    }),
  },
]

const travelSamplesEn = [
  {
    name: '2026 Jeju Island Spring Trip',
    birthYear: '2026.03.01 - 2026.03.05',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: 'Successfully hiked to the top of Mt. Halla' },
      { content: 'Watched the sunrise at Seongsan Ilchulbong' },
      { content: 'Rode a bicycle around Udo Island' },
      { content: 'Discovered an amazing black pork restaurant' },
      { content: 'Watched the sunset at Hyeopjae Beach' },
    ]),
  },
  {
    name: '2026 Tokyo Trip',
    birthYear: '2026.01.10 - 2026.01.14',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: 'Visited Senso-ji Temple in Asakusa' },
      { content: 'Walked across the Shibuya Scramble Crossing' },
      { content: 'Had sushi at Tsukiji Market' },
      { content: 'Went shopping in Harajuku' },
      { content: 'Went up the Tokyo Skytree' },
    ]),
  },
  {
    name: '2025 Busan Summer Trip',
    birthYear: '2025.08.01 - 2025.08.03',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: 'Swam at Haeundae Beach' },
      { content: 'Explored Gamcheon Culture Village' },
      { content: 'Enjoyed the night view of Gwangan Bridge' },
    ]),
  },
]

const memorySamplesEn = [
  {
    name: 'Father',
    birthYear: '1990–2025',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: 'Dad taught me how to ride a bicycle' },
      { content: 'We went fishing by the river every summer' },
      { content: 'Dad gave me a bouquet of flowers at graduation' },
      { content: 'We took a trip to Jeju Island together' },
    ]),
  },
  {
    name: 'Our Family',
    birthYear: '2000–2025',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: 'The whole family took a trip to Gyeongju' },
      { content: 'We gathered at Grandma\'s house every Chuseok' },
      { content: 'Took a family photo for our 20th anniversary' },
      { content: 'The whole family ate together every Sunday' },
    ]),
  },
  {
    name: 'Grandmother',
    birthYear: '1980–2024',
    albumYear: CURRENT_YEAR,
    highlights: makeMoments([
      { content: 'Walked through the market holding Grandma\'s hand as a child' },
      { content: 'I miss the kimchi stew Grandma used to make' },
      { content: 'Grew vegetables in Grandma\'s garden' },
      { content: 'Celebrated Grandma\'s 80th birthday together' },
    ]),
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
