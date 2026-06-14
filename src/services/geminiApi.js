import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

/**
 * Gemini에 프롬프트를 보내고 JSON 응답을 파싱해서 반환합니다.
 * @param {string} prompt
 * @returns {Promise<unknown>}
 */
async function callGemini(prompt) {
  const result = await model.generateContent(prompt)
  const text = result.response.text()
  const clean = text.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
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
}) {
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

### 말투
- 친근한 구어체, ~요/~어요/~습니다 혼용
- 흥분/감탄 표현 자주 사용: "미쳤어요", "개맛도리", "레전드", "왕왕"
- 줄임말, 신조어 자연스럽게 섞기: "렛츠고", "챱챱", "맛도리"
- 쉼표 여러개(,,), ㅋㅋ, ㅠㅠ 적절히 사용
- 혼잣말 스타일의 감탄: "대창 사랑해...", "소주 야르~하다"
- 가성비 포인트는 꼭 가격 직접 명시

### 구조 (이 순서로 작성)
1. 인사 + 방문 계기 (2~3줄, 짧게)
2. 가게명 + 위치/영업시간 소제목 → 주소, 영업시간 기재
3. 내부/분위기 소제목 → 분위기 묘사
4. 기본찬/반찬 소제목 → 반찬 묘사
5. 메인 메뉴 소제목 → 메뉴별 개인 코멘트, 취향 순위
6. 마무리 총평 + 강력 추천 멘트
7. 주소 한 번 더 기재

### SEO 규칙
- 소제목 형식: "[지역] [음식종류] 맛집 [가게명]" 패턴 사용
- 본문 키워드를 자연스럽게 2~3회 반복 삽입
- 게시글 끝에 주소 텍스트로 한 번 더 작성

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
