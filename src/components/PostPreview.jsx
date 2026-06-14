import { useEffect, useState } from 'react'
import { generatePost } from '../services/geminiApi'

function PostPreview({ restaurantInfo, selection }) {
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState('')
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (!restaurantInfo || !selection) return

    let isCancelled = false

    const loadPost = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await generatePost({
          storeName: restaurantInfo.storeName,
          address: restaurantInfo.address,
          location: restaurantInfo.location,
          foodType: restaurantInfo.foodType,
          priceRange: restaurantInfo.priceRange,
          atmosphere: restaurantInfo.atmosphere,
          specialNotes: restaurantInfo.specialNotes,
          hours: restaurantInfo.hours,
          titleKeyword: selection.titleKeyword,
          bodyKeywords: selection.bodyKeywords,
        })
        if (!isCancelled) setPost(data)
      } catch (err) {
        if (!isCancelled) setError(err.message || '게시글 생성 중 오류가 발생했습니다.')
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    loadPost()

    return () => {
      isCancelled = true
    }
  }, [restaurantInfo, selection, reloadKey])

  const handleCopy = async (key, text) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(key)
      setTimeout(() => setCopied(''), 1500)
    } catch {
      setError('복사에 실패했습니다. 직접 선택해서 복사해주세요.')
    }
  }

  if (!restaurantInfo || !selection) {
    return (
      <p className="text-sm text-gray-500">
        먼저 [키워드 분석] 탭에서 키워드를 선정하고 게시글 생성을 진행해주세요.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">게시글 미리보기</h2>
        <button
          type="button"
          onClick={() => setReloadKey((key) => key + 1)}
          disabled={loading}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          다시 생성
        </button>
      </div>

      {loading && <p className="text-sm text-gray-500">게시글을 생성하고 있어요...</p>}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      {!loading && !error && post && (
        <div className="space-y-4">
          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-700">제목</h3>
            <p className="rounded-md border border-gray-200 bg-white p-3 text-sm font-semibold text-gray-900">
              {post.title}
            </p>
          </div>

          <div>
            <h3 className="mb-1 text-sm font-medium text-gray-700">본문</h3>
            <div className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-md border border-gray-200 bg-white p-3 text-sm text-gray-900">
              {post.content}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleCopy('title', post.title)}
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
            >
              {copied === 'title' ? '복사됨!' : '제목 복사'}
            </button>
            <button
              type="button"
              onClick={() => handleCopy('content', post.content)}
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-600"
            >
              {copied === 'content' ? '복사됨!' : '본문 복사'}
            </button>
            <button
              type="button"
              onClick={() => handleCopy('all', `${post.title}\n\n${post.content}`)}
              className="rounded-md bg-gray-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
            >
              {copied === 'all' ? '복사됨!' : '전체 복사'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostPreview
