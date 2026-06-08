import { useI18n } from '../../i18n/I18nContext.jsx'

export default function QuizProgress({ answered, current, total }) {
  const { t } = useI18n()
  const progress = total ? Math.round(((current + 1) / total) * 100) : 0

  return (
    <div>
      <div className="d-flex justify-content-between text-muted small fw-semibold mb-2">
        <span>{t('questionProgress', { current: current + 1, total })}</span>
        <span>{t('answeredCount', { answered, total })}</span>
      </div>
      <div className="quiz-progress-track">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  )
}
