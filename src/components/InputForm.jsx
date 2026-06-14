import { useState } from 'react'
import { extractStoreInfoFromImage } from '../services/geminiApi'

const initialFormData = {
  storeName: '',
  location: '',
  address: '',
  foodType: '',
  priceRange: '',
  hours: '',
  atmosphere: '',
  specialNotes: '',
  keywords: '',
}

const inputClass =
  'w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500'

function Field({ label, required, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

/**
 * 이미지 파일을 base64 문자열(data: 접두사 제외)로 변환합니다.
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function InputForm({ onAnalyze }) {
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})
  const [isExtracting, setIsExtracting] = useState(false)
  const [captureError, setCaptureError] = useState('')
  const [captureNotice, setCaptureNotice] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handlePasteCapture = async (e) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageItem = Array.from(items).find((item) => item.type.startsWith('image/'))
    if (!imageItem) return

    e.preventDefault()
    const file = imageItem.getAsFile()
    if (!file) return

    setCaptureError('')
    setCaptureNotice('')
    setIsExtracting(true)
    try {
      const base64 = await fileToBase64(file)
      const result = await extractStoreInfoFromImage({ base64, mimeType: file.type })

      if (!result.address && !result.hours) {
        setCaptureError('이미지에서 정보를 찾지 못했어요. 직접 입력해주세요.')
        return
      }

      setFormData((prev) => ({
        ...prev,
        address: result.address || prev.address,
        hours: result.hours || prev.hours,
      }))
      setCaptureNotice('캡쳐 이미지에서 주소/영업시간을 가져왔어요. 필요한 부분은 직접 수정해주세요.')
    } catch (err) {
      setCaptureError(err.message || '이미지에서 정보를 추출하지 못했어요. 직접 입력해주세요.')
    } finally {
      setIsExtracting(false)
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.storeName.trim()) newErrors.storeName = '가게명을 입력해주세요.'
    if (!formData.location.trim()) newErrors.location = '지역을 입력해주세요.'
    if (!formData.address.trim()) newErrors.address = '주소를 입력해주세요.'
    if (!formData.foodType.trim()) newErrors.foodType = '음식 종류를 입력해주세요.'
    if (!formData.keywords.trim()) newErrors.keywords = '키워드를 1개 이상 입력해주세요.'
    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) {
      onAnalyze?.(formData)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 rounded-md border border-dashed border-gray-300 p-4">
        <label className="mb-1 block text-sm font-medium text-gray-700">
          주소 / 영업시간 캡쳐 붙여넣기
        </label>
        <div
          onPaste={handlePasteCapture}
          tabIndex={0}
          className="flex min-h-[72px] cursor-text items-center justify-center rounded-md border border-gray-300 bg-gray-50 px-3 py-2 text-center text-sm text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {isExtracting
            ? '캡쳐 이미지에서 정보를 추출하는 중...'
            : '여기를 클릭하고 캡쳐 이미지를 붙여넣어주세요 (Ctrl+V)'}
        </div>
        <p className="mt-1 text-xs text-gray-400">
          네이버플레이스 등의 주소/영업시간 캡쳐를 붙여넣으면 주소와 영업시간을 자동으로 채워드려요.
        </p>
        {captureError && <p className="text-xs text-red-500">{captureError}</p>}
        {captureNotice && <p className="text-xs text-green-600">{captureNotice}</p>}
      </div>

      <Field label="가게명" required error={errors.storeName}>
        <input
          type="text"
          name="storeName"
          value={formData.storeName}
          onChange={handleChange}
          placeholder="예: 형제곱창"
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="지역" required error={errors.location}>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            placeholder="예: 강남역"
            className={inputClass}
          />
        </Field>
        <Field label="주소" required error={errors.address}>
          <input
            type="text"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="예: 서울 강남구 강남대로 396"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="음식 종류" required error={errors.foodType}>
          <input
            type="text"
            name="foodType"
            value={formData.foodType}
            onChange={handleChange}
            placeholder="예: 곱창, 막창"
            className={inputClass}
          />
        </Field>
        <Field label="가격대" error={errors.priceRange}>
          <input
            type="text"
            name="priceRange"
            value={formData.priceRange}
            onChange={handleChange}
            placeholder="예: 1인 15,000원~"
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="영업시간" error={errors.hours}>
        <input
          type="text"
          name="hours"
          value={formData.hours}
          onChange={handleChange}
          placeholder="예: 매일 11:00 ~ 22:00"
          className={inputClass}
        />
      </Field>

      <Field label="분위기 특징" error={errors.atmosphere}>
        <input
          type="text"
          name="atmosphere"
          value={formData.atmosphere}
          onChange={handleChange}
          placeholder="예: 데이트, 회식, 혼밥"
          className={inputClass}
        />
      </Field>

      <Field label="특이사항" error={errors.specialNotes}>
        <textarea
          name="specialNotes"
          value={formData.specialNotes}
          onChange={handleChange}
          rows={3}
          placeholder="예: 살얼음 소주, 직원이 구워줌, 화장실 실내"
          className={inputClass}
        />
      </Field>

      <Field label="키워드 입력" required error={errors.keywords}>
        <input
          type="text"
          name="keywords"
          value={formData.keywords}
          onChange={handleChange}
          placeholder="예: 강남 곱창, 강남역 맛집, 강남 술집"
          className={inputClass}
        />
        <p className="mt-1 text-xs text-gray-400">쉼표(,)로 구분해 여러 개 입력할 수 있어요.</p>
      </Field>

      <div className="pt-2">
        <button
          type="submit"
          className="w-full rounded-md bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-600 sm:w-auto"
        >
          분석 시작
        </button>
      </div>
    </form>
  )
}

export default InputForm
