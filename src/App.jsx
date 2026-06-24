import { useEffect, useState } from 'react'
import InputForm from './components/InputForm'
import KeywordAnalysis from './components/KeywordAnalysis'
import PostPreview from './components/PostPreview'
import ThumbnailEditor from './components/ThumbnailEditor'
import { loadFromStorage, saveToStorage } from './utils/storage'

const TABS = [
  { id: 'input', label: '맛집 정보 입력' },
  { id: 'keyword', label: '키워드 분석' },
  { id: 'preview', label: '게시글 미리보기' },
  { id: 'thumbnail', label: '썸네일 생성' },
]

function App() {
  const [activeTab, setActiveTab] = useState(() => loadFromStorage('activeTab', 'input'))
  const [restaurantInfo, setRestaurantInfo] = useState(() => loadFromStorage('restaurantInfo', null))
  const [selectedKeywords, setSelectedKeywords] = useState(() => loadFromStorage('selectedKeywords', null))

  useEffect(() => { saveToStorage('activeTab', activeTab) }, [activeTab])
  useEffect(() => { saveToStorage('restaurantInfo', restaurantInfo) }, [restaurantInfo])
  useEffect(() => { saveToStorage('selectedKeywords', selectedKeywords) }, [selectedKeywords])

  const handleAnalyze = (formData) => {
    setRestaurantInfo(formData)
    setActiveTab('keyword')
  }

  const handleGeneratePost = (selection) => {
    setSelectedKeywords(selection)
    setActiveTab('preview')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <h1 className="mx-auto max-w-4xl px-4 py-4 text-xl font-bold text-gray-900">
          네이버 맛집 블로그 게시글 자동화
        </h1>
      </header>

      <nav className="mx-auto max-w-4xl px-4">
        <div className="flex gap-2 border-b border-gray-200">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-6">
        {activeTab === 'input' && <InputForm onAnalyze={handleAnalyze} />}
        {activeTab === 'keyword' && (
          <KeywordAnalysis restaurantInfo={restaurantInfo} onGeneratePost={handleGeneratePost} />
        )}
        {activeTab === 'preview' && (
          <PostPreview restaurantInfo={restaurantInfo} selection={selectedKeywords} />
        )}
        {activeTab === 'thumbnail' && <ThumbnailEditor restaurantInfo={restaurantInfo} />}
      </main>
    </div>
  )
}

export default App
