const KEY = 'bk_view_history'
const MAX = 30

export function recordView({ _id, title, subject, course }) {
  const history = getHistory()
  const entry = { id: _id, title, subject: subject || '', course: course || '', ts: Date.now() }
  const deduped = [entry, ...history.filter(h => h.id !== _id)].slice(0, MAX)
  try { localStorage.setItem(KEY, JSON.stringify(deduped)) } catch { }
}

export function getHistory() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') } catch { return [] }
}

// Returns up to `limit` keywords ranked by frequency, giving extra weight to user's major
export function getTopKeywords(userMajor, limit = 4) {
  const history = getHistory()
  const freq = {}

  const bump = (word, weight = 1) => {
    if (!word) return
    const k = word.trim().toLowerCase()
    if (k) freq[k] = (freq[k] || 0) + weight
  }

  if (userMajor) bump(userMajor, 5)

  history.forEach(h => {
    bump(h.subject, 1)
    bump(h.course, 1)
  })

  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([kw]) => kw)
}
