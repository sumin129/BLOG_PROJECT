import { useEffect, useState } from 'react'
import { fetchKeywordCompetition, getCompetitionLevel } from '../services/naverApi'
import { selectKeywords } from '../services/geminiApi'
import { loadFromStorage, saveToStorage } from '../utils/storage'

const LEVEL_BADGE_CLASS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
}

function parseKeywords(keywordsText) {
  return (keywordsText ?? '')
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean)
}

function KeywordAnalysis({ restaurantInfo, onGeneratePost }) {
  const [results, setResults] = useState(() => loadFromStorage('keywordResults', []))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selection, setSelection] = useState(() => loadFromStorage('keywordSelection', null))
  const [selectionLoading, setSelectionLoading] = useState(false)
  const [selectionError, setSelectionError] = useState('')

  const keywords = parseKeywords(restaurantInfo?.keywords)

  useEffect(() => {
    if (keywords.length === 0) return

    const cached = loadFromStorage('keywordResults', [])
    const cachedFor = loadFromStorage('keywordResultsFor', null)
    if (cached.length > 0 && cachedFor === restaurantInfo?.keywords) return

    let isCancelled = false

    const loadCompetition = async () => {
      setLoading(true)
      setError('')
      setSelection(null)
      saveToStorage('keywordSelection', null)
      setSelectionError('')
      try {
        const data = await fetchKeywordCompetition(keywords)
        if (!isCancelled) {
          setResults(data)
          saveToStorage('keywordResults', data)
          saveToStorage('keywordResultsFor', restaurantInfo?.keywords)
        }
      } catch (err) {
        if (!isCancelled) setError(err.message || '키워드 분석 중 오류가 발생했습니다.')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadCompetition()

    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantInfo])

  useEffect(() => {
    if (results.length === 0) return

    const cached = loadFromStorage('keywordSelection', null)
    if (cached) return

    let isCancelled = false

    const loadSelection = async () => {
      setSelectionLoading(true)
      setSelectionError('')
      try {
        const data = await selectKeywords({
          storeName: restaurantInfo.storeName,
          location: restaurantInfo.location,
          foodType: restaurantInfo.foodType,
          keywordResults: results,
        })
        if (!isCancelled) {
          setSelection(data)
          saveToStorage('keywordSelection', data)
        }
      } catch (err) {
        if (!isCancelled) setSelectionError(err.message || '키워드 선정 중 오류가 발생했습니다.')
      } finally {
        if (!isCancelled) setSelectionLoading(false)
      }
    }

    loadSelection()

    return () => {
      isCancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [results])

  if (!restaurantInfo) {
    return (
      <p className="text-sm text-gray-500">
        먼저 [맛집 정보 입력] 탭에서 정보를 입력하고 분석을 시작해주세요.
      </p>
    )
  }

  if (keywords.length === 0) {
    return (
      <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">
        분석할 키워드가 없습니다. [맛집 정보 입력] 탭에서 키워드를 입력해주세요.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-900">키워드 경쟁도 분석</h2>

        {loading && <p className="text-sm text-gray-500">키워드별 블로그 검색 결과를 조회하고 있어요...</p>}

        {error && (
          <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        )}

        {!loading && !error && results.length > 0 && (
          <table className="w-full overflow-hidden rounded-md border border-gray-200 text-sm">
            <thead className="bg-gray-100 text-left text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium">키워드</th>
                <th className="px-3 py-2 font-medium">블로그 검색 결과 수</th>
                <th className="px-3 py-2 font-medium">경쟁도</th>
              </tr>
            </thead>
            <tbody>
              {results.map(({ word, total }) => {
                const competition = getCompetitionLevel(total)
                return (
                  <tr key={word} className="border-t border-gray-200">
                    <td className="px-3 py-2 text-gray-900">{word}</td>
                    <td className="px-3 py-2 text-gray-700">{total.toLocaleString()}개</td>
                    <td className="px-3 py-2">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${LEVEL_BADGE_CLASS[competition.level]}`}
                      >
                        {competition.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {results.length > 0 && (
        <div className="space-y-3 border-t border-gray-200 pt-4">
          <h3 className="text-base font-semibold text-gray-900">AI 추천 키워드</h3>

          {selectionLoading && (
            <p className="text-sm text-gray-500">최적 키워드를 선정하고 있어요...</p>
          )}

          {selectionError && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{selectionError}</p>
          )}

          {!selectionLoading && !selectionError && selection && (
            <div className="space-y-3">
              <div className="space-y-2 rounded-md border border-gray-200 bg-white p-3 text-sm">
                <div>
                  <span className="font-medium text-gray-700">제목 키워드: </span>
                  <span className="rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700">
                    {selection.titleKeyword}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-700">본문 키워드:</span>
                  {selection.bodyKeywords.map((word) => (
                    <span
                      key={word}
                      className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700"
                    >
                      {word}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-gray-500">선정 근거: {selection.reason}</p>
              </div>

              <button
                type="button"
                onClick={() => onGeneratePost?.(selection)}
                className="w-full rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 sm:w-auto"
              >
                게시글 생성
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default KeywordAnalysis
