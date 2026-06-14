import { useCallback, useEffect, useState } from 'react'
import html2canvas from 'html2canvas-pro'
import Cropper from 'react-easy-crop'

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

const CANVAS_SIZE = 600
const PHOTO_ASPECT = 1

const TEXT_POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'center-left', 'center', 'center-right',
  'bottom-left', 'bottom-center', 'bottom-right',
]

const POSITION_CLASSES = {
  'top-left': 'justify-start items-start text-left',
  'top-center': 'justify-start items-center text-center',
  'top-right': 'justify-start items-end text-right',
  'center-left': 'justify-center items-start text-left',
  'center': 'justify-center items-center text-center',
  'center-right': 'justify-center items-end text-right',
  'bottom-left': 'justify-end items-start text-left',
  'bottom-center': 'justify-end items-center text-center',
  'bottom-right': 'justify-end items-end text-right',
}

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = url
  })

const getCroppedImage = async (imageSrc, cropArea) => {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  canvas.width = cropArea.width
  canvas.height = cropArea.height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    image,
    cropArea.x,
    cropArea.y,
    cropArea.width,
    cropArea.height,
    0,
    0,
    cropArea.width,
    cropArea.height
  )

  return canvas.toDataURL('image/png')
}

function ThumbnailEditor({ restaurantInfo }) {
  const [imageUrl, setImageUrl] = useState(null)
  const [rawImageUrl, setRawImageUrl] = useState(null)
  const [isCropping, setIsCropping] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [mainText, setMainText] = useState(restaurantInfo?.storeName ?? '')
  const [subText, setSubText] = useState(
    [restaurantInfo?.location, restaurantInfo?.foodType].filter(Boolean).join(' ')
  )
  const [textColor, setTextColor] = useState('#ffffff')
  const [textPosition, setTextPosition] = useState('bottom-left')
  const [overlayOpacity, setOverlayOpacity] = useState(0.25)
  const [swapTextOrder, setSwapTextOrder] = useState(false)
  const [mainFontSize, setMainFontSize] = useState(80)
  const [subFontSize, setSubFontSize] = useState(40)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!rawImageUrl) return
    return () => URL.revokeObjectURL(rawImageUrl)
  }, [rawImageUrl])

  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setRawImageUrl(URL.createObjectURL(file))
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setIsCropping(true)
  }

  const handleCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleApplyCrop = async () => {
    if (!rawImageUrl || !croppedAreaPixels) return
    try {
      const cropped = await getCroppedImage(rawImageUrl, croppedAreaPixels)
      setImageUrl(cropped)
      setIsCropping(false)
    } catch (err) {
      setError(err.message || '이미지 크롭 중 오류가 발생했습니다.')
    }
  }

  const handleCancelCrop = () => {
    setIsCropping(false)
    if (!imageUrl) {
      setRawImageUrl(null)
    }
  }

  const handleRecrop = () => {
    if (!rawImageUrl) return
    setIsCropping(true)
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

  const mainTextEl = (
    <p
      key="main"
      className="font-bold leading-tight"
      style={{
        color: textColor,
        fontSize: `${mainFontSize}px`,
        textShadow: '0 2px 6px rgba(0,0,0,0.55)',
      }}
    >
      {mainText}
    </p>
  )

  const subTextEl = (
    <p
      key="sub"
      className="font-medium leading-snug"
      style={{
        color: textColor,
        fontSize: `${subFontSize}px`,
        textShadow: '0 1px 4px rgba(0,0,0,0.55)',
      }}
    >
      {subText}
    </p>
  )

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
          {imageUrl && (
            <button
              type="button"
              onClick={handleRecrop}
              className="mt-2 text-sm font-medium text-blue-500 hover:text-blue-600"
            >
              다시 자르기
            </button>
          )}
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
          <label className="mb-1 block text-sm font-medium text-gray-700">문구 위치</label>
          <div className="grid w-24 grid-cols-3 gap-1">
            {TEXT_POSITIONS.map((pos) => (
              <button
                key={pos}
                type="button"
                onClick={() => setTextPosition(pos)}
                aria-label={pos}
                className={`h-7 w-7 rounded border ${
                  textPosition === pos
                    ? 'border-blue-500 bg-blue-500'
                    : 'border-gray-300 bg-white hover:bg-gray-100'
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">메인/서브 순서</label>
          <button
            type="button"
            onClick={() => setSwapTextOrder((prev) => !prev)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            {swapTextOrder ? '서브 → 메인' : '메인 → 서브'}
          </button>
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

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            메인 문구 폰트 크기: {mainFontSize}px
          </label>
          <input
            type="range"
            min="28"
            max="100"
            step="1"
            value={mainFontSize}
            onChange={(e) => setMainFontSize(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            서브 문구 폰트 크기: {subFontSize}px
          </label>
          <input
            type="range"
            min="14"
            max="56"
            step="1"
            value={subFontSize}
            onChange={(e) => setSubFontSize(Number(e.target.value))}
            className="w-full"
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
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
          >
            {imageUrl ? (
              <img
                src={imageUrl}
                alt="썸네일 배경"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500">
                사진을 업로드해주세요
              </div>
            )}

            <div className="absolute inset-0 bg-black" style={{ opacity: overlayOpacity }} />

            <div
              className={`absolute inset-0 flex flex-col gap-2 p-8 ${POSITION_CLASSES[textPosition]}`}
            >
              {swapTextOrder ? [subTextEl, mainTextEl] : [mainTextEl, subTextEl]}
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

      {isCropping && rawImageUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-md bg-white p-4 shadow-lg">
            <p className="mb-2 text-sm font-medium text-gray-700">이미지 크롭 (1:1)</p>
            <div className="relative h-80 w-full overflow-hidden rounded-md bg-gray-900">
              <Cropper
                image={rawImageUrl}
                crop={crop}
                zoom={zoom}
                aspect={PHOTO_ASPECT}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
              />
            </div>

            <div className="mt-3">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                확대/축소
              </label>
              <input
                type="range"
                min="1"
                max="3"
                step="0.1"
                value={zoom}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full"
              />
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={handleCancelCrop}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleApplyCrop}
                className="rounded-md bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-600"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ThumbnailEditor
