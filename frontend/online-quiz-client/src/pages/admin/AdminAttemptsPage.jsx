import { CheckCircle2, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDate } from '../../utils/format.js'

export default function AdminAttemptsPage() {
  const { language, t } = useI18n()
  const [attempts, setAttempts] = useState([])
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/quiz-attempts')
      .then((response) => setAttempts(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  async function openDetail(id) {
    setError('')
    try {
      const { data } = await api.get(`/quiz-attempts/${id}`)
      setDetail(data)
    } catch (err) {
      setError(getErrorMessage(err))
    }
  }

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title={t('attemptsStats')} subtitle={t('attemptsStatsSubtitle')} />
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3">
        <div className="col-xl-7">
          <div className="page-card p-3">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead><tr><th>{t('student')}</th><th>{t('quiz')}</th><th>{t('score')}</th><th>{t('submitted')}</th><th></th></tr></thead>
                <tbody>
                  {attempts.map((attempt) => (
                    <tr key={attempt.id}>
                      <td>
                        <div className="fw-semibold">{attempt.studentName}</div>
                        <small className="text-muted">{attempt.studentEmail}</small>
                      </td>
                      <td>{attempt.quizTitle}</td>
                      <td><span className="badge text-bg-primary">{attempt.score}%</span></td>
                      <td>{formatDate(attempt.submittedAt, language)}</td>
                      <td className="text-end"><button className="btn btn-outline-primary btn-sm" onClick={() => openDetail(attempt.id)}>{t('view')}</button></td>
                    </tr>
                  ))}
                  {attempts.length === 0 && <tr><td colSpan="5" className="text-muted">{t('noSubmittedAttempts')}</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-xl-5">
          <div className="page-card p-3">
            {detail ? (
              <>
                <h2 className="h5 mb-1">{detail.quizTitle}</h2>
                <p className="text-muted">{detail.studentName} · {detail.score}% · {detail.correctCount}/{detail.totalQuestions} {t('correct').toLowerCase()}</p>
                <div className="vstack gap-2">
                  {detail.answers.map((answer) => (
                    <div className="border rounded-2 p-2" key={answer.questionId}>
                      <div className="d-flex gap-2">
                        {answer.isCorrect ? <CheckCircle2 className="text-success" size={18} /> : <XCircle className="text-danger" size={18} />}
                        <div>
                          <div className="fw-semibold">{answer.questionContent}</div>
                          <small className="text-muted">
                            {t('selected')}: {answer.selectedOptionText || t('notAnswered')} · {t('correct')}: {answer.correctOptionText}
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-muted">{t('selectAttempt')}</div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
