const CURRENT_YEAR = String(new Date().getFullYear())

function makeHighlights(entries) {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    content: entries[i + 1] || '',
  }))
}

const childSamples = [
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

const petSamples = [
  {
    name: '코코',
    birthYear: '2021',
    albumYear: CURRENT_YEAR,
    highlights: makeHighlights({
      1: '처음으로 공원 산책을 했어요',
      3: '목욕을 처음으로 했어요',
      5: '친구 강아지를 처음 만났어요',
      7: '바다에서 처음 수영했어요',
      9: '훈련소에서 앉아 훈련을 완료했어요',
      12: '크리스마스 선물을 받았어요',
    }),
  },
]

const travelSamples = [
  {
    name: '2026 제주도 봄 여행',
    birthYear: '2026.03.01 - 2026.03.05',
    albumYear: CURRENT_YEAR,
    highlights: [
      { month: 1, content: '한라산 등반에 성공했어요' },
      { month: 2, content: '성산일출봉에서 일출을 봤어요' },
      { month: 3, content: '우도에서 자전거를 탔어요' },
      { month: 4, content: '흑돼지 맛집을 발견했어요' },
      { month: 5, content: '협재 해변에서 노을을 봤어요' },
      { month: 6, content: '' },
      { month: 7, content: '' },
      { month: 8, content: '' },
      { month: 9, content: '' },
      { month: 10, content: '' },
      { month: 11, content: '' },
      { month: 12, content: '' },
    ],
  },
]

const memorySamples = [
  {
    name: '아버지',
    birthYear: '1990~2025년',
    albumYear: CURRENT_YEAR,
    highlights: [
      { month: 1, content: '아버지가 자전거 타는 법을 가르쳐 주셨어요' },
      { month: 2, content: '매년 여름 함께 강가에서 낚시를 했어요' },
      { month: 3, content: '졸업식에서 아버지가 꽃다발을 주셨어요' },
      { month: 4, content: '함께 제주도 여행을 다녀왔어요' },
      { month: 5, content: '' },
      { month: 6, content: '' },
      { month: 7, content: '' },
      { month: 8, content: '' },
      { month: 9, content: '' },
      { month: 10, content: '' },
      { month: 11, content: '' },
      { month: 12, content: '' },
    ],
  },
]

const samplesByType = {
  child: childSamples,
  pet: petSamples,
  travel: travelSamples,
  memory: memorySamples,
}

export function getSample(type) {
  const list = samplesByType[type] || childSamples
  return list[Math.floor(Math.random() * list.length)]
}

export default childSamples
