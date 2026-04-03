const ffmpeg = require('fluent-ffmpeg')
const ffmpegPath = require('ffmpeg-static')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const os = require('os')

ffmpeg.setFfmpegPath(ffmpegPath)

const SLIDE_DURATION = 2.5
const FADE_DURATION = 0.5
const RESOLUTION = { width: 1080, height: 1080 }
const BGM_VOLUME = 0.3
const BGM_FADE_OUT_DURATION = 2

// 텍스트 오버레이 설정
const TITLE_FONT_SIZE = 48
const TEXT_FONT_SIZE = 32
const BAR_PADDING = 24

/**
 * SVG용 XML 특수문자 이스케이프
 */
function escapeXml(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * 반투명 바 + 텍스트 SVG 조각을 생성합니다.
 * @param {number} canvasW - 캔버스 너비
 * @param {number} canvasH - 캔버스 높이
 * @param {{ text: string, fontSize: number, bold: boolean }[]} lines - 텍스트 라인 배열
 * @param {'top'|'bottom'} position - 바 위치
 * @returns {string} SVG 요소 문자열
 */
function buildBarSvg(canvasW, canvasH, lines, position) {
  const lineHeight = 1.5
  const maxChars = 20

  // 긴 텍스트를 maxChars 단위로 줄바꿈하여 확장된 라인 배열 생성
  const wrappedLines = []
  for (const line of lines) {
    const chunks = wrapText(line.text, maxChars)
    for (let i = 0; i < chunks.length; i++) {
      wrappedLines.push({
        text: chunks[i],
        fontSize: line.fontSize,
        bold: line.bold,
      })
    }
  }

  const totalTextH = wrappedLines.reduce((sum, l) => sum + l.fontSize * lineHeight, 0)
  const barH = Math.round(totalTextH + BAR_PADDING * 2)
  const barY = position === 'top' ? 0 : canvasH - barH

  let content = `<rect x="0" y="${barY}" width="${canvasW}" height="${barH}" fill="rgba(0,0,0,0.5)"/>`

  let textY = barY + BAR_PADDING
  for (const line of wrappedLines) {
    textY += line.fontSize
    const weight = line.bold ? 'bold' : 'normal'
    content += `<text x="40" y="${textY}" text-anchor="start" `
      + `font-family="Malgun Gothic, Gulim, sans-serif" `
      + `font-size="${line.fontSize}" font-weight="${weight}" fill="white">`
      + `${escapeXml(line.text)}</text>`
    textY += line.fontSize * (lineHeight - 1)
  }

  return content
}

/**
 * 텍스트를 maxChars 글자 단위로 줄바꿈합니다.
 * @param {string} text
 * @param {number} maxChars
 * @returns {string[]}
 */
function wrapText(text, maxChars) {
  if (!text || text.length <= maxChars) return [text]
  const result = []
  for (let i = 0; i < text.length; i += maxChars) {
    result.push(text.substring(i, i + maxChars))
  }
  return result
}

/**
 * 슬라이드별 텍스트 오버레이 SVG Buffer를 생성합니다.
 * @returns {Buffer|null}
 */
function buildOverlaySvg(index, textData, totalSlides) {
  if (!textData) return null

  const { title, subtitle, captions } = textData
  const { width, height } = RESOLUTION
  const isFirst = index === 0

  let svgContent = ''

  // 커버 슬라이드 (images[0]): title + subtitle 표시, captions[0]은 무시
  if (isFirst) {
    if (title || subtitle) {
      const lines = []
      if (title) lines.push({ text: title, fontSize: TITLE_FONT_SIZE, bold: true })
      if (subtitle) lines.push({ text: subtitle, fontSize: TEXT_FONT_SIZE, bold: false })
      svgContent += buildBarSvg(width, height, lines, 'bottom')

      return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`)
    }
    return null
  }

  // 내지 슬라이드 (images[1]~): memo + content 하단
  const raw = captions?.[index]
  const memo = typeof raw === 'object' ? (raw?.memo || '') : ''
  const content = typeof raw === 'object' ? (raw?.content || '') : (raw || '')

  if (!memo && !content) return null

  const lines = []
  if (memo) lines.push({ text: memo, fontSize: 24, bold: false })
  if (content) lines.push({ text: content, fontSize: TEXT_FONT_SIZE, bold: false })
  svgContent += buildBarSvg(width, height, lines, 'bottom')

  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${svgContent}</svg>`)
}

/**
 * sharp를 사용하여 이미지를 1080x1080으로 리사이즈하고 텍스트 오버레이를 합성합니다.
 */
async function compositeTextOnImage(imgPath, index, textData, totalSlides) {
  const { width, height } = RESOLUTION

  console.log(`[videoService] 슬라이드 ${index}/${totalSlides - 1} 처리 시작 — captions[${index}] = "${textData.captions?.[index] || '(없음)'}"`)

  const caption = textData.captions?.[index] || ''
  const overlaySvg = buildOverlaySvg(index, textData, totalSlides)
  console.log(`[슬라이드 ${index}] caption: "${caption}", overlaySvg: ${!!overlaySvg}`)
  const tmpPath = imgPath.replace('.png', '_overlay.png')

  if (overlaySvg) {
    console.log(`[videoService] 슬라이드 ${index}: 텍스트 있음 — SVG 합성`)
    console.log(`[videoService] 슬라이드 ${index} SVG 내용:\n${overlaySvg.toString()}`)

    await sharp(imgPath)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .composite([{ input: overlaySvg, top: 0, left: 0 }])
      .png()
      .toFile(tmpPath)
  } else {
    console.log(`[videoService] 슬라이드 ${index}: 텍스트 없음 — 리사이즈만 수행`)

    await sharp(imgPath)
      .resize(width, height, { fit: 'cover', position: 'center' })
      .png()
      .toFile(tmpPath)
  }

  console.log(`[videoService] 슬라이드 ${index}: 처리 완��� — ${tmpPath}`)

  fs.unlinkSync(imgPath)
  fs.renameSync(tmpPath, imgPath)
}

/**
 * 이미지 버퍼 배열로부터 페이드 전환 효과가 적용된 슬라이드쇼 MP4 영상을 생성합니다.
 * @param {Buffer[]} imageBuffers - 이미지 파일 버퍼 배열
 * @param {Buffer|null} bgmBuffer - BGM 파일 버퍼 (없으면 null)
 * @param {string} [bgmExt='.mp3'] - BGM 파일 확장자
 * @param {object|null} [textData=null] - 텍스트 오버레이 데이터 { title, subtitle, captions, story }
 * @returns {Promise<string>} 생성된 영상 파일 경로
 */
async function generateSlideshow(imageBuffers, bgmBuffer, bgmExt = '.mp3', textData = null) {
  const workDir = path.join(os.tmpdir(), `growbook-video-${Date.now()}`)
  fs.mkdirSync(workDir, { recursive: true })

  const imagePaths = []
  for (let i = 0; i < imageBuffers.length; i++) {
    const imgPath = path.join(workDir, `img_${String(i).padStart(3, '0')}.png`)
    fs.writeFileSync(imgPath, imageBuffers[i])
    imagePaths.push(imgPath)
  }

  // sharp + SVG로 텍스트 오버레이 합성
  if (textData) {
    for (let i = 0; i < imagePaths.length; i++) {
      await compositeTextOnImage(imagePaths[i], i, textData, imagePaths.length)
    }
    console.log(`[videoService] ${imagePaths.length}장 텍스트 오버레이 합성 완료`)
  }

  let bgmPath = null
  if (bgmBuffer) {
    bgmPath = path.join(workDir, `bgm${bgmExt}`)
    fs.writeFileSync(bgmPath, bgmBuffer)
  }

  const outputPath = path.join(workDir, 'slideshow.mp4')

  try {
    await buildSlideshowVideo(imagePaths, outputPath, bgmPath)
    return { outputPath, workDir }
  } catch (err) {
    cleanup(workDir)
    throw err
  }
}

/**
 * FFmpeg 복합 필터를 사용하여 페이드 전환이 포함된 슬라이드쇼 영상을 빌드합니다.
 */
function buildSlideshowVideo(imagePaths, outputPath, bgmPath) {
  return new Promise((resolve, reject) => {
    const count = imagePaths.length
    const totalDuration = count * SLIDE_DURATION - (count - 1) * FADE_DURATION

    const command = ffmpeg()

    // 각 이미지를 입력으로 추가 (loop + 슬라이드 지속시간)
    for (const imgPath of imagePaths) {
      command.input(imgPath).inputOptions([
        '-loop', '1',
        '-t', String(SLIDE_DURATION),
        '-framerate', '30',
      ])
    }

    // 복합 필터 구성
    const filters = []
    const { width, height } = RESOLUTION

    // 각 입력 이미지를 스케일 + 패딩하여 해상도 맞춤
    for (let i = 0; i < count; i++) {
      filters.push({
        filter: 'scale',
        options: `${width}:${height}:force_original_aspect_ratio=decrease`,
        inputs: `${i}:v`,
        outputs: `scaled${i}`,
      })
      filters.push({
        filter: 'pad',
        options: `${width}:${height}:(ow-iw)/2:(oh-ih)/2:color=black`,
        inputs: `scaled${i}`,
        outputs: `padded${i}`,
      })
      filters.push({
        filter: 'setsar',
        options: '1',
        inputs: `padded${i}`,
        outputs: `ready${i}`,
      })
    }

    if (count === 1) {
      // 이미지 1장이면 전환 없이 그대로 출력
      filters.push({
        filter: 'format',
        options: 'yuv420p',
        inputs: 'ready0',
        outputs: 'vout',
      })
    } else {
      // xfade 필터로 페이드 전환 적용
      let prevLabel = 'ready0'
      for (let i = 1; i < count; i++) {
        const offset = i * SLIDE_DURATION - i * FADE_DURATION
        const outLabel = i === count - 1 ? 'faded' : `xf${i}`
        filters.push({
          filter: 'xfade',
          options: `transition=fade:duration=${FADE_DURATION}:offset=${offset}`,
          inputs: [prevLabel, `ready${i}`],
          outputs: outLabel,
        })
        prevLabel = outLabel
      }
      filters.push({
        filter: 'format',
        options: 'yuv420p',
        inputs: 'faded',
        outputs: 'vout',
      })
    }

    // BGM 입력 및 오디오 필터 추가
    if (bgmPath) {
      const bgmInputIndex = count
      command.input(bgmPath)

      const fadeOutStart = Math.max(0, totalDuration - BGM_FADE_OUT_DURATION)
      filters.push({
        filter: 'volume',
        options: String(BGM_VOLUME),
        inputs: `${bgmInputIndex}:a`,
        outputs: 'vol',
      })
      filters.push({
        filter: 'afade',
        options: `t=out:st=${fadeOutStart}:d=${BGM_FADE_OUT_DURATION}`,
        inputs: 'vol',
        outputs: 'aout',
      })
    }

    const outputMaps = bgmPath ? ['vout', 'aout'] : 'vout'

    command
      .complexFilter(filters, outputMaps)
      .outputOptions([
        '-c:v', 'libx264',
        '-preset', 'fast',
        '-crf', '23',
        '-movflags', '+faststart',
        '-t', String(totalDuration),
        ...(bgmPath ? ['-c:a', 'aac', '-b:a', '192k'] : ['-an']),
      ])
      .output(outputPath)
      .on('start', (cmd) => {
        console.log('[videoService] FFmpeg 명령어:', cmd)
      })
      .on('error', (err) => {
        console.error('[videoService] FFmpeg 오류:', err.message)
        reject(Object.assign(new Error('영상 생성에 실패했습니다.'), { code: 'VIDEO_GENERATION_FAILED', status: 500 }))
      })
      .on('end', () => {
        console.log('[videoService] 영상 생성 완료:', outputPath)
        resolve()
      })
      .run()
  })
}

/**
 * 작업 디렉토리를 안전하게 삭제합니다.
 */
function cleanup(dirPath) {
  try {
    fs.rmSync(dirPath, { recursive: true, force: true })
    console.log('[videoService] 임시 파일 정리 완료:', dirPath)
  } catch (err) {
    console.error('[videoService] 임시 파일 정리 실패:', err.message)
  }
}

module.exports = { generateSlideshow, cleanup }
