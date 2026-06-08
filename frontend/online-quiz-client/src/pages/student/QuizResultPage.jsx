import { CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDate } from '../../utils/format.js'

export default function QuizResultPage() {
  const { language, t } = useI18n()
  const { attemptId } = useParams()
  const location = useLocation()
  const [result, setResult] = useState(location.state?.result || null)
  const [loading, setLoading] = useState(!location.state?.result)
  const [error, setError] = useState('')

  useEffect(() => {
    if (result) return
    api.get(`/quiz-attempts/${attemptId}`)
      .then((response) => setResult(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [attemptId, result])

  if (loading) return <LoadingState />
  if (!result) return <div className="alert alert-danger">{error || 'Result was not found.'}</div>

  return (
    <>
      <PageHeader
        title={t('quizResult')}
        subtitle={`${result.quizTitle} · ${t('submittedAt', { date: formatDate(result.submittedAt, language) })}`}
        action={<Link className="btn btn-outline-primary" to="/student/quizzes">{t('backToQuizzes')}</Link>}
      />

      <div className="row g-3 mb-4">
        <Summary label={t('score')} value={`${result.score}%`} />
        <Summary label={t('correct')} value={`${result.correctCount}/${result.totalQuestions}`} />
        <Summary label={t('wrong')} value={result.wrongCount} />
        <Summary label={t('timeSpent')} value={t('minuteCount', { count: Math.round(result.timeSpentSeconds / 60) })} />
      </div>

      <div className="vstack gap-3">
        {result.answers.map((answer, index) => (
          <div className="page-card p-3" key={answer.questionId}>
            <div className="d-flex gap-2 align-items-start">
              {answer.isCorrect ? <CheckCircle2 className="text-success mt-1" size={20} /> : <XCircle className="text-danger mt-1" size={20} />}
              <div className="flex-grow-1">
                <h2 className="h6">{t('questionNumber', { number: index + 1 })} {answer.questionContent}</h2>
                <p className="mb-1"><strong>{t('yourAnswer')}:</strong> {answer.selectedOptionText || t('notAnswered')}</p>
                <p className="mb-1"><strong>{t('correctAnswer')}:</strong> {answer.correctOptionText}</p>
                <p className="text-muted mb-0">{answer.explanation}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Summary({ label, value }) {
  return (
    <div className="col-lg-3 col-sm-6">
      <div className="stat-card p-3">
        <div className="text-muted small">{label}</div>
        <div className="fs-3 fw-semibold">{value}</div>
      </div>
    </div>
  )
}
