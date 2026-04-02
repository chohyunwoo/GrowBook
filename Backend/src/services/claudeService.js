const Anthropic = require('@anthropic-ai/sdk')
const ERROR_CODE = require('../constants/errorCode')

const isDev = process.env.NODE_ENV !== 'production'

function log(...args) {
  if (isDev) console.log(...args)
}

function logError(...args) {
  if (isDev) console.error(...args)
}

// ── 타입별 프롬프트 ─────────────────────────────────────────
const PROMPTS = {
  child: {
    system:
      '당신은 따뜻한 감성의 육아 글작가입니다. 아이의 성장을 사랑스럽고 따뜻하게 표현해주세요. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요.',
    user: ({ name, age, albumYear, highlightText }) =>
      `이름: ${name}, 나이: ${age}살, 연도: ${albumYear}년\n월별 하이라이트:\n${highlightText}\n위 내용으로 성장 앨범 스토리를 JSON으로 작성해줘.\n{ "title": "20자 이내 제목", "subtitle": "30자 이내 부제", "story": "500자 내외 성장 스토리" }`,
    mock: ({ name, albumYear }) => ({
      title: `${name}의 ${albumYear}년 — 처음으로 가득한 날들`,
      subtitle: '소중한 순간들이 모인 한 해',
      story: `${albumYear}년, ${name}는 정말 많이 자랐어요. 매달 새로운 도전과 설렘으로 가득했던 한 해였습니다.`,
    }),
  },
  pet: {
    system:
      '당신은 귀엽고 사랑스러운 감성의 글작가입니다. 반려동물의 특별한 순간을 따뜻하고 유쾌하게 표현해주세요. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요.',
    user: ({ name, age, albumYear, highlightText }) =>
      `반려동물 이름: ${name}, 나이: ${age}살, 연도: ${albumYear}년\n월별 하이라이트:\n${highlightText}\n위 내용으로 반려동물 앨범 스토리를 JSON으로 작성해줘.\n{ "title": "20자 이내 제목", "subtitle": "30자 이내 부제", "story": "500자 내외 스토리" }`,
    mock: ({ name, albumYear }) => ({
      title: `${name}의 ${albumYear}년 — 매일이 산책일`,
      subtitle: '꼬리 흔든 365일의 기록',
      story: `${albumYear}년, ${name}는 매일매일이 신나는 모험이었어요. 산책길에서 만난 친구들, 맛있는 간식, 포근한 낮잠까지.`,
    }),
  },
  travel: {
    system:
      '당신은 설레는 여행 감성의 글작가입니다. 여행의 특별한 순간들을 생생하고 감동적으로 표현해주세요. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요.',
    user: ({ name, period, highlightText }) =>
      `여행 제목: ${name}, 기간: ${period}\n특별한 순간들:\n${highlightText}\n위 내용으로 여행 앨범 스토리를 JSON으로 작성해줘.\n{ "title": "20자 이내 제목", "subtitle": "30자 이내 부제", "story": "500자 내외 여행 스토리" }`,
    mock: ({ name }) => ({
      title: `${name} — 떠나야 비로소 보이는 것들`,
      subtitle: '설렘으로 가득했던 여정의 기록',
      story: `${name}, 그 여행은 기대 이상이었어요. 낯선 거리를 걸으며 만난 풍경들이 마음속에 깊이 남았습니다.`,
    }),
  },
  memory: {
    system:
      '당신은 그리움과 감사의 감성을 담은 글작가입니다. 소중한 사람과의 추억을 진심 어리고 따뜻하게 표현해주세요. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요.',
    user: ({ name, period, highlightText }) =>
      `주인공: ${name}, 기간: ${period}\n소중한 순간들:\n${highlightText}\n위 내용으로 추억 앨범 스토리를 JSON으로 작성해줘.\n{ "title": "20자 이내 제목", "subtitle": "30자 이내 부제", "story": "500자 내외 추억 스토리" }`,
    mock: ({ name }) => ({
      title: `${name}과 함께한 날들`,
      subtitle: '잊지 못할 소중한 순간들',
      story: `${name}과 함께한 시간은 하나하나가 보석 같았어요. 웃고 울고, 때론 아무 말 없이 함께 있는 것만으로도 충분했던 날들.`,
    }),
  },
}

/**
 * Claude AI로 타입별 스토리를 생성합니다.
 * @param {object} params
 * @param {string} params.type - child | pet | travel | memory
 * @param {string} params.name
 * @param {number} [params.birthYear]
 * @param {number} [params.albumYear]
 * @param {string} [params.period]
 * @param {Array<{month?: number, content: string}>} params.highlights
 * @returns {Promise<{title: string, subtitle: string, story: string}>}
 */
async function generateStory({ type = 'child', name, birthYear, albumYear, period, highlights }) {
  const prompt = PROMPTS[type] || PROMPTS.child

  const highlightText =
    highlights
      .filter((h) => h.content && h.content.trim() !== '')
      .map((h) => (h.month ? `${h.month}월: ${h.content}` : h.content))
      .join('\n') || '(기록 없음)'

  const age = albumYear && birthYear ? albumYear - birthYear : undefined
  const ctx = { name: name.trim(), age, albumYear, birthYear, period, highlightText }

  // development 환경이면 Mock 반환
  if (process.env.NODE_ENV === 'development') {
    log('[claudeService] Mock 데이터 반환 (development)')
    return prompt.mock(ctx)
  }

  log('[claudeService] generateStory 시작', { type, name: ctx.name, age, albumYear })

  if (!process.env.ANTHROPIC_API_KEY) {
    log('[claudeService] Mock 데이터 반환 (ANTHROPIC_API_KEY 없음)')
    return prompt.mock(ctx)
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: prompt.system,
      messages: [{ role: 'user', content: prompt.user(ctx) }],
    })
  } catch (err) {
    logError('[claudeService] API 호출 실패:', err.message)
    const error = new Error('AI 스토리 생성 중 오류가 발생했습니다.')
    error.code = ERROR_CODE.CLAUDE_API_ERROR
    throw error
  }

  const text = message.content[0].text
  log('[claudeService] 응답 수신 완료, 길이:', text.length)

  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    logError('[claudeService] JSON 블록 추출 실패. 응답:', text)
    const error = new Error('AI 응답을 파싱할 수 없습니다.')
    error.code = ERROR_CODE.CLAUDE_API_ERROR
    throw error
  }

  let data
  try {
    data = JSON.parse(match[0])
  } catch (err) {
    logError('[claudeService] JSON 파싱 실패. 추출된 텍스트:', match[0])
    const error = new Error('AI 응답 JSON 파싱에 실패했습니다.')
    error.code = ERROR_CODE.CLAUDE_API_ERROR
    throw error
  }

  log('[claudeService] 생성 완료:', { title: data.title, subtitle: data.subtitle })
  return data
}

/**
 * 하이라이트 텍스트를 감성적인 캡션으로 변환합니다.
 * @param {string} highlight - 원본 텍스트
 * @param {string} type - 앨범 타입
 * @returns {Promise<{caption: string}>}
 */
async function generateCaption(highlight, type) {
  if (process.env.NODE_ENV === 'development') {
    log('[claudeService] caption Mock 반환 (development)')
    return { caption: highlight + '의 순간' }
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    log('[claudeService] caption Mock 반환 (ANTHROPIC_API_KEY 없음)')
    return { caption: highlight + '의 순간' }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 256,
      system: '당신은 감성적인 글작가입니다. 사용자가 입력한 짧은 텍스트를 더 감성적이고 시적인 표현으로 변환해주세요. 20자 이내로 작성하고 JSON만 반환하세요.',
      messages: [{ role: 'user', content: `아래 텍스트를 감성적인 캡션으로 변환해줘:\n${highlight}\n반환 형식: { "caption": "변환된 캡션" }` }],
    })
  } catch (err) {
    logError('[claudeService] caption API 호출 실패:', err.message)
    const error = new Error('AI 캡션 생성 중 오류가 발생했습니다.')
    error.code = ERROR_CODE.CLAUDE_API_ERROR
    throw error
  }

  const text = message.content[0].text
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) {
    logError('[claudeService] caption JSON 추출 실패. 응답:', text)
    const error = new Error('AI 응답을 파싱할 수 없습니다.')
    error.code = ERROR_CODE.CLAUDE_API_ERROR
    throw error
  }

  let data
  try {
    data = JSON.parse(match[0])
  } catch (err) {
    logError('[claudeService] caption JSON 파싱 실패:', match[0])
    const error = new Error('AI 응답 JSON 파싱에 실패했습니다.')
    error.code = ERROR_CODE.CLAUDE_API_ERROR
    throw error
  }

  log('[claudeService] caption 생성 완료:', data.caption)
  return data
}

module.exports = { generateStory, generateCaption }
