import { Award, CheckCircle2, Clock, XCircle } from 'lucide-react'
import { useI18n } from '../../i18n/I18nContext.jsx'
import StatCard from '../ui/StatCard.jsx'

export default function ResultSummary({ result }) {
  const { t } = useI18n()

  return (
    <div className="row g-3 mb-4">
      <div className="col-xl-3 col-sm-6">
        <StatCard icon={Award} label={t('score')} tone="primary" value={`${result.score}%`} />
      </div>
      <div className="col-xl-3 col-sm-6">
        <StatCard icon={CheckCircle2} label={t('correct')} tone="success" value={`${result.correctCount}/${result.totalQuestions}`} />
      </div>
      <div className="col-xl-3 col-sm-6">
        <StatCard icon={XCircle} label={t('wrong')} tone="danger" value={result.wrongCount} />
      </div>
      <div className="col-xl-3 col-sm-6">
        <StatCard icon={Clock} label={t('timeSpent')} tone="warning" value={t('minuteCount', { count: Math.round(result.timeSpentSeconds / 60) })} />
      </div>
    </div>
  )
}
