const PREFIX = 'blog_'
const DRAFTS_KEY = PREFIX + 'drafts'
const MAX_DRAFTS = 5

export function saveToStorage(key, data) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(data))
  } catch {
    // localStorage 용량 초과 등 무시
  }
}

export function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export function saveDraft(formData) {
  const drafts = loadDrafts()
  const draft = {
    id: Date.now(),
    savedAt: new Date().toISOString(),
    storeName: formData.storeName || '(이름 없음)',
    formData,
  }
  const next = [draft, ...drafts].slice(0, MAX_DRAFTS)
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(next))
  } catch {
    // 무시
  }
  return next
}

export function loadDrafts() {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function deleteDraft(id) {
  const drafts = loadDrafts().filter((d) => d.id !== id)
  try {
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts))
  } catch {
    // 무시
  }
  return drafts
}
