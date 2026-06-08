import { CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import ResultSummary from '../../components/quiz/ResultSummary.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Card from '../../components/ui/Card.jsx'
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
  if (!result) return <Alert>{error || 'Result was not found.'}</Alert>

  return (
    <>
      <PageHeader
        title={t('quizResult')}
        subtitle={`${result.quizTitle} | ${t('submittedAt', { date: formatDate(result.submittedAt, language) })}`}
        action={<Link className="btn btn-outline-primary" to="/student/quizzes">{t('backToQuizzes')}</Link>}
      />

      <Card className="dashboard-hero p-4 p-lg-5 mb-4">
        <div className="row g-4 align-items-center">
          <div className="col-lg-8">
            <div className="text-white-50 fw-semibold">{t('score')}</div>
            <div className="display-2 fw-bold">{result.score}%</div>
          </div>
          <div className="col-lg-4">
            <div className="quiz-progress-track bg-white bg-opacity-25">
              <div className="quiz-progress-fill bg-white" style={{ width: `${Math.min(100, Number(result.score))}%` }} />
            </div>
          </div>
        </div>
      </Card>

      <ResultSummary result={result} />

      <div className="vstack gap-3">
        {result.answers.map((answer, index) => (
          <Card className="p-4" key={answer.questionId}>
            <div className="d-flex gap-3 align-items-start">
              <div className={`icon-box ${answer.isCorrect ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'} flex-shrink-0`}>
                {answer.isCorrect ? <CheckCircle2 size={22} /> : <XCircle size={22} />}
              </div>
              <div className="flex-grow-1">
                <div className="d-flex flex-wrap justify-content-between gap-2 mb-2">
                  <h2 className="h5 fw-bold mb-0">{t('questionNumber', { number: index + 1 })} {answer.questionContent}</h2>
                  <Badge variant={answer.isCorrect ? 'success' : 'danger'}>{answer.isCorrect ? t('correct') : t('wrong')}</Badge>
                </div>
                <p className="mb-1"><strong>{t('yourAnswer')}:</strong> {answer.selectedOptionText || t('notAnswered')}</p>
                <p className="mb-1"><strong>{t('correctAnswer')}:</strong> {answer.correctOptionText}</p>
                <p className="text-muted mb-0">{answer.explanation}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </>
  )
}
