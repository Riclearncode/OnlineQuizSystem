export function formatDate(value, language = 'en') {
  if (!value) return '-'
  return new Intl.DateTimeFormat(language === 'vi' ? 'vi-VN' : 'en', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

export function difficultyBadge(difficulty) {
  const normalized = String(difficulty)
  if (normalized === 'Easy') return 'success'
  if (normalized === 'Medium') return 'warning'
  return 'danger'
}
