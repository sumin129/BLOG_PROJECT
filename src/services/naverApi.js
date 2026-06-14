const BLOG_SEARCH_URL = '/naver-api/v1/search/blog.json'

// 경쟁도 판단 기준: 10만 이하 = 좋음, 30만 이하 = 보통, 30만 초과 = 경쟁 심함
const COMPETITION_THRESHOLDS = {
  LOW: 100000,
  MEDIUM: 300000,
}

/**
 * 키워드 1개의 네이버 블로그 검색 결과 수를 조회합니다.
 * @param {string} keyword
 * @returns {Promise<number>} 블로그 게시글 총 개수
 */
export async function fetchBlogTotal(keyword) {
  const url = `${BLOG_SEARCH_URL}?query=${encodeURIComponent(keyword)}&display=1`
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error(`네이버 검색 API 요청에 실패했습니다. (status: ${res.status})`)
  }

  const data = await res.json()
  return data.total ?? 0
}

/**
 * 여러 키워드의 네이버 블로그 검색 결과 수를 조회합니다.
 * @param {string[]} keywords
 * @returns {Promise<{ word: string, total: number }[]>}
 */
export async function fetchKeywordCompetition(keywords) {
  return Promise.all(
    keywords.map(async (keyword) => ({
      word: keyword,
      total: await fetchBlogTotal(keyword),
    }))
  )
}

/**
 * 블로그 검색 결과 수를 기준으로 경쟁도를 판단합니다.
 * @param {number} total
 * @returns {{ label: string, level: 'low' | 'medium' | 'high' }}
 */
export function getCompetitionLevel(total) {
  if (total <= COMPETITION_THRESHOLDS.LOW) return { label: '좋음', level: 'low' }
  if (total <= COMPETITION_THRESHOLDS.MEDIUM) return { label: '보통', level: 'medium' }
  return { label: '경쟁 심함', level: 'high' }
}
