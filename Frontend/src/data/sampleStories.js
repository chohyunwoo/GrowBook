function makeHighlights(entries) {
  return Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    content: entries[i + 1] || '',
  }))
}

const sampleStories = [
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

export default sampleStories
