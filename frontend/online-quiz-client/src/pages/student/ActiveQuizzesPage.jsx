import { Clock, PlayCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'

export default function ActiveQuizzesPage() {
  const { t } = useI18n()
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/quizzes')
      .then((response) => setQuizzes(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title={t('activeQuizzes')} subtitle={t('activeQuizzesSubtitle')} />
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        {quizzes.map((quiz) => (
          <div className="col-lg-4 col-md-6" key={quiz.id}>
            <div className="page-card p-3 h-100 d-flex flex-column">
              <h2 className="h5">{quiz.title}</h2>
              <p className="text-muted line-clamp-2">{quiz.description}</p>
              <div className="d-flex gap-3 text-muted small mb-3">
                <span>{t('questionCount', { count: quiz.totalQuestions })}</span>
                <span className="d-inline-flex align-items-center gap-1"><Clock size={14} /> {t('minuteCount', { count: quiz.timeLimitMinutes })}</span>
              </div>
              <Link className="btn btn-primary mt-auto d-inline-flex align-items-center justify-content-center gap-2" to={`/student/quizzes/${quiz.id}/take`}>
                <PlayCircle size={18} />
                {t('startQuiz')}
              </Link>
            </div>
          </div>
        ))}
        {quizzes.length === 0 && <div className="col-12"><div className="page-card p-4 text-muted">{t('noActiveQuizzes')}</div></div>}
      </div>
    </>
  )
}
