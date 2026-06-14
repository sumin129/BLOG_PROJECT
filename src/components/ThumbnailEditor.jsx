import { useEffect, useState } from 'react'
import html2canvas from 'html2canvas'

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

function ThumbnailEditor({ restaurantInfo }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [mainText, setMainText] = useState(restaurantInfo?.storeName ?? '')
  const [subText, setSubText] = useState(
    [restaurantInfo?.location, restaurantInfo?.foodType].filter(Boolean).join(' ')
  )
  const [overlayOpacity, setOverlayOpacity] = useState(0.4)
  const [textColor, setTextColor] = useState('#ffffff')
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!imageUrl) return
    return () => URL.revokeObjectURL(imageUrl)
  }, [imageUrl])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageUrl(URL.createObjectURL(file))
  }

  const handleDownload = async () => {
    const el = document.getElementById('thumbnail-preview')
    if (!el) return

    setDownloading(true)
    setError('')
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true })
      const link = document.createElement('a')
      link.download = `${restaurantInfo?.storeName || '썸네일'}_썸네일.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      setError(err.message || '썸네일 다운로드 중 오류가 발생했습니다.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">썸네일 생성</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">사진 업로드</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="block w-full text-sm text-gray-700"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">텍스트 색상</label>
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="h-10 w-20 cursor-pointer rounded-md border border-gray-300"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">메인 문구</label>
          <input
            type="text"
            value={mainText}
            onChange={(e) => setMainText(e.target.value)}
            placeholder="예: 형제곱창"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">서브 문구</label>
          <input
            type="text"
            value={subText}
            onChange={(e) => setSubText(e.target.value)}
            placeholder="예: 강남역 곱창"
            className={inputClass}
          />
        </div>

        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-gray-700">
            어두운 오버레이 투명도: {Math.round(overlayOpacity * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={overlayOpacity}
            onChange={(e) => setOverlayOpacity(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">실시간 미리보기</p>
        <div className="overflow-x-auto rounded-md border border-gray-200 bg-gray-100 p-4">
          <div
            id="thumbnail-preview"
            className="relative shrink-0 overflow-hidden bg-gray-300"
            style={{ width: 800, height: 533 }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="썸네일 배경"
                crossOrigin="anonymous"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                사진을 업로드해주세요
              </div>
            )}

            <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />

            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 px-10 text-center">
              <p className="text-5xl font-bold drop-shadow-lg" style={{ color: textColor }}>
                {mainText}
              </p>
              <p className="text-2xl font-medium drop-shadow-lg" style={{ color: textColor }}>
                {subText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      <button
        type="button"
        onClick={handleDownload}
        disabled={downloading}
        className="w-full rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 disabled:opacity-50 sm:w-auto"
      >
        {downloading ? '다운로드 중...' : 'PNG 다운로드'}
      </button>
    </div>
  )
}

export default ThumbnailEditor
