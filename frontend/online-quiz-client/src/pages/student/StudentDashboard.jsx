import { ClipboardCheck, History, ListChecks, Trophy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api, { getErrorMessage } from '../../api/client.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import LoadingState from '../../components/LoadingState.jsx'
import PageHeader from '../../components/PageHeader.jsx'
import Alert from '../../components/ui/Alert.jsx'
import Badge, { scoreVariant } from '../../components/ui/Badge.jsx'
import Card, { CardHeader } from '../../components/ui/Card.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import StatCard from '../../components/ui/StatCard.jsx'
import { useI18n } from '../../i18n/I18nContext.jsx'
import { formatDate } from '../../utils/format.js'

export default function StudentDashboard() {
  const { user } = useAuth()
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
  const recentAttempts = data.history.slice(0, 5)

  return (
    <>
      <PageHeader title={t('studentDashboard')} subtitle={t('studentDashboardSubtitle')} />
      <Alert>{error}</Alert>

      <Card className="dashboard-hero p-4 p-lg-5 mb-4">
        <div className="row g-4 align-items-center">
          <div className="col-lg-8">
            <div className="text-white-50 fw-semibold mb-2">{t('welcomeBack')}</div>
            <h2 className="display-6 fw-bold mb-2">{user?.fullName}</h2>
            <p className="lead mb-0">{t('learningMomentum')}</p>
          </div>
          <div className="col-lg-4">
            <div className="bg-white bg-opacity-10 rounded-4 p-3">
              <div className="text-white-50 small">{t('activeQuizPreview')}</div>
              <div className="fs-2 fw-bold">{data.quizzes.length}</div>
              <Link className="btn btn-light btn-sm mt-2" to="/student/quizzes">{t('startQuiz')}</Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="row g-3 mb-4">
        <div className="col-xl-3 col-md-4">
          <StatCard icon={ListChecks} label={t('activeQuizzes')} tone="primary" value={data.quizzes.length} />
        </div>
        <div className="col-xl-3 col-md-4">
          <StatCard icon={History} label={t('completedAttempts')} tone="success" value={data.history.length} />
        </div>
        <div className="col-xl-3 col-md-4">
          <StatCard icon={ClipboardCheck} label={t('bestScore')} tone="warning" value={`${bestScore}%`} />
        </div>
        <div className="col-xl-3 col-md-4">
          <StatCard icon={Trophy} label={t('score')} tone="danger" value={recentAttempts[0]?.score != null ? `${recentAttempts[0].score}%` : '-'} />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="p-4 border-bottom">
          <CardHeader
            title={t('recentAttempts')}
            action={<Link className="btn btn-outline-primary btn-sm" to="/student/history">{t('viewAll')}</Link>}
          />
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
              {recentAttempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td className="fw-semibold">{attempt.quizTitle}</td>
                  <td><Badge variant={scoreVariant(attempt.score)}>{attempt.score}%</Badge></td>
                  <td>{attempt.correctCount}/{attempt.totalQuestions}</td>
                  <td>{formatDate(attempt.submittedAt, language)}</td>
                </tr>
              ))}
              {recentAttempts.length === 0 && (
                <tr>
                  <td colSpan="4">
                    <EmptyState compact message={t('noAttemptsYet')} />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
