import { ClipboardCheck, History, ListChecks } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client.js'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDate } from '../../utils/format.js'

export default function StudentDashboard() {
  const { language, t } = useI18n()
  const [data, setData] = useState({ quizzes: [], history: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [quizzes, history] = await Promise.all([
          api.get('/quizzes'),
          api.get('/quiz-attempts/my-history'),
        ])
        setData({ quizzes: quizzes.data, history: history.data })
      } catch (err) {
        setError(getErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <LoadingState />

  const bestScore = data.history.length ? Math.max(...data.history.map((x) => Number(x.score))) : 0

  return (
    <>
      <PageHeader title={t('studentDashboard')} subtitle={t('studentDashboardSubtitle')} />
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="row g-3 mb-4">
        <StatCard icon={ListChecks} label={t('activeQuizzes')} value={data.quizzes.length} />
        <StatCard icon={History} label={t('completedAttempts')} value={data.history.length} />
        <StatCard icon={ClipboardCheck} label={t('bestScore')} value={`${bestScore}%`} />
      </div>

      <div className="page-card p-3">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="h5 mb-0">{t('recentAttempts')}</h2>
          <Link className="btn btn-outline-primary btn-sm" to="/student/history">{t('viewAll')}</Link>
        </div>
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr>
                <th>{t('quiz')}</th>
                <th>{t('score')}</th>
                <th>{t('correct')}</th>
                <th>{t('submitted')}</th>
              </tr>
            </thead>
            <tbody>
              {data.history.slice(0, 5).map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.quizTitle}</td>
                  <td><span className="badge text-bg-primary">{attempt.score}%</span></td>
                  <td>{attempt.correctCount}/{attempt.totalQuestions}</td>
                  <td>{formatDate(attempt.submittedAt, language)}</td>
                </tr>
              ))}
              {data.history.length === 0 && (
                <tr><td colSpan="4" className="text-muted">{t('noAttemptsYet')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="col-md-4">
      <div className="stat-card p-3 d-flex align-items-center gap-3">
        <div className="bg-primary-subtle text-primary rounded-2 p-2">
          <Icon size={24} />
        </div>
        <div>
          <div className="text-muted small">{label}</div>
          <div className="fs-3 fw-semibold">{value}</div>
        </div>
      </div>
    </div>
  )
}
