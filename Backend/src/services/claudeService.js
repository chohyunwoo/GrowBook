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
      '당신은 따뜻한 감성의 육아 글작가입니다. 아이의 성장을 사랑스럽고 따뜻하게 표현해주세요. 제목은 간결하게, 꾸밈없이 작성하세요. 사용자가 입력한 내용만 바탕으로 작성하세요. 입력하지 않은 내용은 절대 추가하거나 상상해서 쓰지 마세요. 입력이 적으면 적은 대로만 자연스럽게 작성하세요. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요.',
    user: ({ name, age, albumYear, highlightText }) =>
      `이름: ${name}, 나이: ${age}살, 연도: ${albumYear}년\n월별 하이라이트:\n${highlightText}\n위 내용으로 성장 앨범 스토리를 JSON으로 작성해줘.\n제목은 화려한 수식어나 대시(—) 없이 간결하게 작성해주세요.\n예시: '${name}의 ${albumYear}년' (O)\n예시: '${name}의 ${albumYear}년 — 처음으로 가득한 날들' (X)\n부제는 사용자가 입력한 내용을 반영해서 자연스럽게 작성해주세요.\n스토리는 사용자가 입력한 내용을 최대한 반영해서 실제 경험처럼 작성해주세요.\n{ "title": "20자 이내 간결한 제목", "subtitle": "30자 이내 부제", "story": "400자 이내 성장 스토리" }`,
    mock: ({ name, albumYear }) => ({
      title: `${name}의 ${albumYear}년`,
      subtitle: '소중한 순간들이 모인 한 해',
      story: `${albumYear}년, ${name}는 정말 많이 자랐어요. 매달 새로운 도전과 설렘으로 가득했던 한 해였습니다.`,
    }),
  },
  pet: {
    system:
      '당신은 귀엽고 사랑스러운 감성의 글작가입니다. 반려동물의 특별한 순간을 따뜻하고 유쾌하게 표현해주세요. 제목은 간결하게, 꾸밈없이 작성하세요. 사용자가 입력한 내용만 바탕으로 작성하세요. 입력하지 않은 내용은 절대 추가하거나 상상해서 쓰지 마세요. 입력이 적으면 적은 대로만 자연스럽게 작성하세요. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요.',
    user: ({ name, age, albumYear, highlightText }) =>
      `반려동물 이름: ${name}, 나이: ${age}살, 연도: ${albumYear}년\n월별 하이라이트:\n${highlightText}\n위 내용으로 반려동물 앨범 스토리를 JSON으로 작성해줘.\n제목은 화려한 수식어나 대시(—) 없이 간결하게 작성해주세요.\n예시: '${name}와 함께한 ${albumYear}년' (O)\n예시: '${name}의 ${albumYear}년 — 매일이 산책일' (X)\n부제는 사용자가 입력한 내용을 반영해서 자연스럽게 작성해주세요.\n스토리는 사용자가 입력한 내용을 최대한 반영해서 실제 경험처럼 작성해주세요.\n{ "title": "20자 이내 간결한 제목", "subtitle": "30자 이내 부제", "story": "400자 이내 스토리" }`,
    mock: ({ name, albumYear }) => ({
      title: `${name}와 함께한 ${albumYear}년`,
      subtitle: '매일이 특별했던 우리의 기록',
      story: `${albumYear}년, ${name}는 매일매일이 신나는 모험이었어요. 산책길에서 만난 친구들, 맛있는 간식, 포근한 낮잠까지.`,
    }),
  },
  travel: {
    system:
      '당신은 자연스러운 여행 글작가입니다. 여행의 특별한 순간들을 생생하게 표현해주세요. 제목은 간결하게, 꾸밈없이 작성하세요. 사용자가 입력한 내용만 바탕으로 작성하세요. 입력하지 않은 내용은 절대 추가하거나 상상해서 쓰지 마세요. 입력이 적으면 적은 대로만 자연스럽게 작성하세요. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요.',
    user: ({ name, period, highlightText }) =>
      `여행 제목: ${name}, 기간: ${period}\n특별한 순간들:\n${highlightText}\n위 내용으로 여행 앨범 스토리를 JSON으로 작성해줘.\n제목은 화려한 수식어나 대시(—) 없이 간결하게 작성해주세요.\n예시: '${name}' (O)\n예시: '${name} — 떠나야 비로소 보이는 것들' (X)\n부제는 사용자가 입력한 내용을 반영해서 자연스럽게 작성해주세요.\n스토리는 사용자가 입력한 내용을 최대한 반영해서 실제 경험처럼 작성해주세요.\n{ "title": "20자 이내 간결한 제목", "subtitle": "30자 이내 부제", "story": "400자 이내 여행 스토리" }`,
    mock: ({ name }) => ({
      title: `${name}`,
      subtitle: '우리가 함께 걸었던 길',
      story: `${name}, 그 여행은 기대 이상이었어요. 낯선 거리를 걸으며 만난 풍경들이 마음속에 깊이 남았습니다.`,
    }),
  },
  memory: {
    system:
      '당신은 진심을 담아 글을 쓰는 작가입니다. 소중한 사람과의 추억을 따뜻하게 표현해주세요. 제목은 간결하게, 꾸밈없이 작성하세요. 사용자가 입력한 내용만 바탕으로 작성하세요. 입력하지 않은 내용은 절대 추가하거나 상상해서 쓰지 마세요. 입력이 적으면 적은 대로만 자연스럽게 작성하세요. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요.',
    user: ({ name, period, highlightText }) =>
      `주인공: ${name}, 기간: ${period}\n소중한 순간들:\n${highlightText}\n위 내용으로 추억 앨범 스토리를 JSON으로 작성해줘.\n제목은 화려한 수식어나 대시(—) 없이 간결하게 작성해주세요.\n예시: '${name}와의 소중한 순간들' (O)\n예시: '${name}과 함께한 날들 — 잊지 못할 기억' (X)\n부제는 사용자가 입력한 내용을 반영해서 자연스럽게 작성해주세요.\n스토리는 사용자가 입력한 내용을 최대한 반영해서 실제 경험처럼 작성해주세요.\n{ "title": "20자 이내 간결한 제목", "subtitle": "30자 이내 부제", "story": "400자 이내 추억 스토리" }`,
    mock: ({ name }) => ({
      title: `${name}와의 소중한 순간들`,
      subtitle: '함께여서 더 빛났던 날들',
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
      .join('\n')

  const age = albumYear && birthYear ? albumYear - birthYear : undefined
  const ctx = { name: name.trim(), age, albumYear, birthYear, period, highlightText }

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

module.exports = { generateStory }
