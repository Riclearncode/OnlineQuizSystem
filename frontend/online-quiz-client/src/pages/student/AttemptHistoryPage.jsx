import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDate } from '../../utils/format.js'

export default function AttemptHistoryPage() {
  const { language, t } = useI18n()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/quiz-attempts/my-history')
      .then((response) => setHistory(response.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingState />

  return (
    <>
      <PageHeader title={t('attemptHistory')} subtitle={t('attemptHistorySubtitle')} />
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="page-card p-3">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>{t('quiz')}</th>
                <th>{t('score')}</th>
                <th>{t('correct')}</th>
                <th>{t('submitted')}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {history.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.quizTitle}</td>
                  <td><span className="badge text-bg-primary">{attempt.score}%</span></td>
                  <td>{attempt.correctCount}/{attempt.totalQuestions}</td>
                  <td>{formatDate(attempt.submittedAt, language)}</td>
                  <td className="text-end">
                    <Link className="btn btn-outline-primary btn-sm" to={`/student/results/${attempt.id}`}>{t('details')}</Link>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr><td colSpan="5" className="text-muted">{t('noAttemptsYet')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
