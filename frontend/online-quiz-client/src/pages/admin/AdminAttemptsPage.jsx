import { CheckCircle2, Eye, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Badge, { scoreVariant } from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import Card from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDate } from '../../utils/format.js'

export default function AdminAttemptsPage() {
  const { language, t } = useI18n()
  const [attempts, setAttempts] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/quiz-attempts')
      .then((response) => setAttempts(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  async function openDetail(id) {
    setError('')
    setDetailLoading(true)
    try {
      const { data } = await api.get(`/quiz-attempts/${id}`)
      setDetail(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setDetailLoading(false)
    }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title={t('attemptsStats')} subtitle={t('attemptsStatsSubtitle')} />
      <Alert>{error}</Alert>

      <div className="row g-3">
        <div className="col-xl-7">
          <Card className="p-0 overflow-hidden">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead>
                  <tr>
                    <th>{t('student')}</th>
                    <th>{t('quiz')}</th>
                    <th>{t('score')}</th>
                    <th>{t('submitted')}</th>
                    <th className="text-end">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td>
                        <div className="fw-bold">{attempt.studentName}</div>
                        <small className="text-muted">{attempt.studentEmail}</small>
                      </td>
                      <td>{attempt.quizTitle}</td>
                      <td><Badge variant={scoreVariant(attempt.score)}>{attempt.score}%</Badge></td>
                      <td>{formatDate(attempt.submittedAt, language)}</td>
                      <td className="text-end">
                        <Button icon={Eye} onClick={() => openDetail(attempt.id)} size="sm" variant="outline">{t('view')}</Button>
                      </td>
                    </tr>
                  ))}
                  {attempts.length === 0 && (
                    <tr>
                      <td colSpan="5">
                        <EmptyState compact message={t('noSubmittedAttempts')} />
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="col-xl-5">
          <Card className="p-4 h-100">
            {detailLoading && (
              <div className="text-center text-muted py-4">
                <div className="spinner-border spinner-border-sm me-2" />
                {t('loading')}
              </div>
            )}
            {!detailLoading && detail ? (
              <>
                <div className="d-flex justify-content-between align-items-start gap-3 mb-3">
                  <div>
                    <h2 className="h5 fw-bold mb-1">{detail.quizTitle}</h2>
                    <p className="text-muted mb-0">{detail.studentName}</p>
                  </div>
                  <Badge variant={scoreVariant(detail.score)}>{detail.score}%</Badge>
                </div>
                <p className="text-muted">
                  {detail.correctCount}/{detail.totalQuestions} {t('correct').toLowerCase()}
                </p>
                <div className="vstack gap-2">
                  {detail.answers.map((answer) => (
                    <div className="border rounded-4 p-3" key={answer.questionId}>
                      <div className="d-flex gap-2">
                        {answer.isCorrect ? <CheckCircle2 className="text-success mt-1" size={18} /> : <XCircle className="text-danger mt-1" size={18} />}
                        <div>
                          <div className="fw-semibold">{answer.questionContent}</div>
                          <small className="text-muted">
                            {t('selected')}: {answer.selectedOptionText || t('notAnswered')} | {t('correct')}: {answer.correctOptionText}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : !detailLoading && (
              <EmptyState compact message={t('selectAttempt')} />
            )}
          </Card>
        </div>
      </div>
    </>
  )
}
