const Anthropic = require('@anthropic-ai/sdk')
const ERROR_CODE = require('../constants/errorCode')

const isDev = process.env.NODE_ENV !== 'production'

function log(...args) {
  if (isDev) console.log(...args)
}

function logError(...args) {
  if (isDev) console.error(...args)
}

/**
 * Claude AI로 아이 성장 스토리를 생성합니다.
 * @param {string} name - 아이 이름
 * @param {number} birthYear - 출생 연도
 * @param {number} albumYear - 앨범 연도
 * @param {Array<{month: number, content: string}>} highlights - 월별 하이라이트 12개
 * @returns {Promise<{title: string, subtitle: string, story: string}>}
 */
async function generateStory(name, birthYear, albumYear, highlights) {
  if (process.env.NODE_ENV === 'development') {
    return {
      title: `${name}의 ${albumYear}년 — 처음으로 가득한 날들`,
      subtitle: `소중한 순간들이 모인 한 해`,
      story: `${albumYear}년, ${name}는 정말 많이 자랐어요.`,
    }
  }

  const age = albumYear - birthYear

  const filledHighlights = highlights
    .filter((h) => h.content && h.content.trim() !== '')
    .map((h) => `${h.month}월: ${h.content}`)
    .join('\n')

  const userPrompt = [
    `아이 이름: ${name.trim()}`,
    `나이: ${age}살`,
    `연도: ${albumYear}년`,
    ``,
    `월별 하이라이트:`,
    filledHighlights || '(기록 없음)',
    ``,
    `위 정보를 바탕으로 아이의 성장 스토리를 작성해주세요.`,
    `다음 JSON 형식으로만 응답해주세요:`,
    `{`,
    `  "title": "20자 이내 제목",`,
    `  "subtitle": "30자 이내 부제",`,
    `  "story": "500자 내외 성장 스토리"`,
    `}`,
  ].join('\n')

  log('[claudeService] generateStory 시작', { name: name.trim(), age, albumYear })

  if (!process.env.ANTHROPIC_API_KEY) {
    log('[claudeService] Mock 데이터 반환 (ANTHROPIC_API_KEY 없음)')
    return {
      title: `${name}의 ${albumYear}년 — 처음으로 가득한 날들`,
      subtitle: '소중한 순간들이 모인 한 해',
      story: `${albumYear}년, ${name}는 정말 많이 자랐어요. 매달 새로운 도전과 설렘으로 가득했던 한 해였습니다.`,
    }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  let message
  try {
    message = await anthropic.messages.create({
      model: 'claude-opus-4-6',
      max_tokens: 1024,
      system: '당신은 따뜻한 감성의 글작가입니다. 요청한 형식의 JSON만 반환하고 다른 텍스트는 포함하지 마세요.',
      messages: [{ role: 'user', content: userPrompt }],
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
