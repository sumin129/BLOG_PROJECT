import { GoogleGenerativeAI } from '@google/generative-ai'
import { POST_STYLE_GUIDE } from './postStyleGuide'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

/**
 * Gemini에 프롬프트(텍스트 또는 텍스트+이미지)를 보내고 JSON 응답을 파싱해서 반환합니다.
 * @param {string | Array<string | object>} contentParts
 * @returns {Promise<unknown>}
 */
async function callGemini(contentParts, retries = 5) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent(contentParts)
      const text = result.response.text()
      const clean = text.replace(/```json|```/g, '').trim()
      return JSON.parse(clean)
    } catch (err) {
      const isRetryable =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.message?.includes('503') ||
        err?.message?.includes('429') ||
        err?.message?.includes('high demand') ||
        err?.message?.includes('RESOURCE_EXHAUSTED')
      if (isRetryable && attempt < retries) {
        const delay = Math.min(2000 * 2 ** attempt, 30000)
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw err
    }
  }
}

/**
 * 키워드 경쟁도 분석 결과를 바탕으로 제목/본문 키워드를 선정합니다.
 * @param {object} params
 * @param {string} params.storeName
 * @param {string} params.location
 * @param {string} params.foodType
 * @param {{ word: string, total: number }[]} params.keywordResults
 * @returns {Promise<{ titleKeyword: string, bodyKeywords: string[], reason: string }>}
 */
export async function selectKeywords({ storeName, location, foodType, keywordResults }) {
  const prompt = `
당신은 네이버 블로그 SEO 전문가입니다.
아래 키워드 목록과 각 키워드의 네이버 블로그 검색 결과 수를 보고,
제목에 사용할 최적 키워드 1개와 본문에 사용할 키워드 3~5개를 선정해주세요.

맛집 정보:
- 가게명: ${storeName}
- 지역: ${location}
- 음식종류: ${foodType}

키워드 분석 결과:
${keywordResults.map((k) => `- "${k.word}": 블로그 ${k.total.toLocaleString()}개`).join('\n')}

선정 기준:
1. 검색 결과 수가 적을수록 노출 유리 (경쟁도 낮음)
2. 지역명+음식종류 조합이 효과적
3. 너무 광범위하거나 너무 좁은 키워드 제외
4. 제목 키워드는 가장 검색될 법한 자연스러운 표현

JSON 형식으로만 응답:
{
  "titleKeyword": "선정된 제목 키워드",
  "bodyKeywords": ["키워드1", "키워드2", "키워드3"],
  "reason": "선정 근거 한 줄 설명"
}
`

  const data = await callGemini(prompt)

  if (
    typeof data.titleKeyword !== 'string' ||
    !Array.isArray(data.bodyKeywords) ||
    typeof data.reason !== 'string'
  ) {
    throw new Error('키워드 선정 응답 형식이 올바르지 않습니다. 다시 시도해주세요.')
  }

  return data
}

/**
 * 맛집 정보와 선정된 키워드를 바탕으로 네이버 블로그 게시글을 생성합니다.
 * @param {object} params
 * @param {string} params.storeName
 * @param {string} params.address
 * @param {string} params.location
 * @param {string} params.foodType
 * @param {string} params.priceRange
 * @param {string} params.atmosphere
 * @param {string} params.specialNotes
 * @param {string} params.hours
 * @param {string} params.titleKeyword
 * @param {string[]} params.bodyKeywords
 * @param {string} [params.feedback] 보완 요청 사항
 * @param {{ title: string, content: string }} [params.previousPost] 이전 생성 결과
 * @returns {Promise<{ title: string, content: string }>}
 */
export async function generatePost({
  storeName,
  address,
  location,
  foodType,
  priceRange,
  atmosphere,
  specialNotes,
  hours,
  titleKeyword,
  bodyKeywords,
  feedback,
  previousPost,
}) {
  const feedbackSection = feedback
    ? `

## 이전 생성 결과
제목: ${previousPost?.title ?? ''}
본문:
${previousPost?.content ?? ''}

## 보완 요청 (반드시 반영)
${feedback}

위 이전 생성 결과를 바탕으로, 보완 요청 사항을 반영해서 게시글을 다시 작성해주세요.
나머지 말투/구조/SEO 규칙은 동일하게 유지하세요.
`
    : ''
  const prompt = `
당신은 네이버 맛집 블로그 작성 전문가입니다.
아래 정보와 스타일 가이드를 참고해서 블로그 게시글을 작성해주세요.

## 맛집 정보
- 가게명: ${storeName}
- 주소: ${address}
- 지역: ${location}
- 음식종류: ${foodType}
- 가격대: ${priceRange}
- 분위기: ${atmosphere}
- 특이사항: ${specialNotes}
- 영업시간: ${hours}

## 키워드
- 제목 키워드: ${titleKeyword}
- 본문 키워드: ${bodyKeywords.join(', ')}

## 작성 스타일 가이드 (필수 준수)

${POST_STYLE_GUIDE}

${feedbackSection}
제목과 본문을 아래 JSON 형식으로만 응답:
{
  "title": "제목",
  "content": "본문 전체"
}
`

  const data = await callGemini(prompt)

  if (typeof data.title !== 'string' || typeof data.content !== 'string') {
    throw new Error('게시글 생성 응답 형식이 올바르지 않습니다. 다시 시도해주세요.')
  }

  return data
}

/**
 * 네이버플레이스 등에서 캡쳐한 이미지에서 주소와 영업시간을 추출합니다.
 * @param {object} params
 * @param {string} params.base64 이미지의 base64 데이터 (data: 접두사 제외)
 * @param {string} params.mimeType 이미지 MIME 타입 (예: image/png)
 * @returns {Promise<{ address: string, hours: string }>}
 */
export async function extractStoreInfoFromImage({ base64, mimeType }) {
  const prompt = `
아래는 네이버플레이스 등에서 캡쳐한 가게 정보 이미지입니다.
이미지에서 주소와 영업시간 정보를 추출해주세요.

추출 규칙:
- address: 이미지에 보이는 도로명 주소를 그대로 추출 (건물명, 층 정보 포함)
- hours: 요일별 영업시간을 분석해서 한 줄로 정리
  - 대부분의 요일(7일 중 5일 이상)이 같은 영업시간이면 "매일 [영업시간] (라스트오더 [시간])"으로 요약하고, 나머지 예외 요일은 뒤에 이어서 표기
    (예: "매일 16:00 - 22:30 (라스트오더 21:30), 화요일 정기휴무")
  - 그렇지 않으면 영업시간이 같은 요일끼리 묶어서 표현
    (예: "월~금 11:00 - 22:00, 토~일 12:00 - 23:00 (라스트오더 22:00)")
  - 라스트오더/정기휴무 정보가 있으면 함께 표기
- 이미지에서 해당 정보를 찾을 수 없으면 빈 문자열("")로 응답

JSON 형식으로만 응답:
{
  "address": "추출된 주소",
  "hours": "추출된 영업시간"
}
`

  const data = await callGemini([prompt, { inlineData: { data: base64, mimeType } }])

  if (typeof data.address !== 'string' || typeof data.hours !== 'string') {
    throw new Error('이미지에서 정보를 추출하지 못했습니다. 다시 시도해주세요.')
  }

  return data
}
