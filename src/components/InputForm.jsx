import { useState } from 'react'

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

function InputForm({ onAnalyze }) {
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState({})

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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
