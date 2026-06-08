import { Clock, FileQuestion, PlayCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nContext.jsx'
import Card from '../ui/Card.jsx'

export default function QuizCard({ quiz }) {
  const { t } = useI18n()

  return (
    <Card className="p-4 h-100 d-flex flex-column">
      <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div className="icon-box bg-primary-subtle text-primary">
          <FileQuestion size={22} />
        </div>
        {typeof quiz.isActive === 'boolean' && (
          <span className={`badge text-bg-${quiz.isActive ? 'success' : 'secondary'}`}>
            {quiz.isActive ? t('active') : t('inactive')}
          </span>
        )}
      </div>

      <h2 className="h5 fw-bold mb-2">{quiz.title}</h2>
      <p className="text-muted line-clamp-2 mb-3">{quiz.description}</p>

      <div className="d-flex flex-wrap gap-2 text-muted small mb-4">
        <span className="badge text-bg-light">{t('questionCount', { count: quiz.totalQuestions })}</span>
        <span className="badge text-bg-light d-inline-flex align-items-center gap-1">
          <Clock size={14} /> {t('minuteCount', { count: quiz.timeLimitMinutes })}
        </span>
      </div>

      <Link className="btn btn-primary w-100 mt-auto d-inline-flex align-items-center justify-content-center gap-2" to={`/student/quizzes/${quiz.id}/take`}>
        <PlayCircle size={18} />
        {t('startQuiz')}
      </Link>
    </Card>
  )
}
